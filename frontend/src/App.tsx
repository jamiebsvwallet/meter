import React, { useState, type FormEvent, Suspense } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  AppBar, Toolbar, List, ListItem, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Fab, LinearProgress, Typography, IconButton, Grid
} from '@mui/material'
import { styled } from '@mui/system'
import AddIcon from '@mui/icons-material/Add'
import GitHubIcon from '@mui/icons-material/GitHub'
import DashboardIcon from '@mui/icons-material/Dashboard'
import useAsyncEffect from 'use-async-effect'
import { type Meter, type Token } from './types/types'
import './App.scss'
const VRPlaceholder = React.lazy(() => import('./components/VRPlaceholder'))
const UnifiedDashboard = React.lazy(() => import('./components/UnifiedDashboard'))
const FeatureHistory = React.lazy(() => import('./components/FeatureHistory'))
const PhotoJobReport = React.lazy(() => import('./components/PhotoJobReport'))
const PilotSignup = React.lazy(() => import('./components/PilotSignup'))
import { IdentityCard } from 'metanet-identity-react'

// Heavy blockchain SDKs and contract libraries are dynamically imported where needed to reduce initial bundle size.

// These are some basic styling rules for the React application.
// We are using MUI (https://mui.com) for all of our UI components (i.e. buttons and dialogs etc.).
const AppBarPlaceholder = styled('div')({
  height: '4em'
})

const NoItems = styled(Grid)({
  margin: 'auto',
  textAlign: 'center',
  marginTop: '5em'
})

const AddMoreFab = styled(Fab)({
  position: 'fixed',
  right: '1em',
  bottom: '1em',
  zIndex: 10
})

const LoadingBar = styled(LinearProgress)({
  margin: '1em'
})

const GitHubIconStyle = styled(IconButton)({
  color: '#ffffff'
})

const App: React.FC = () => {
  // These are some state variables that control the app's interface.
  const [isMncMissing, setIsMncMissing] = useState<boolean>(false)
  const [createOpen, setCreateOpen] = useState<boolean>(false)
  const [createLoading, setCreateLoading] = useState<boolean>(false)
  const [metersLoading, setMetersLoading] = useState<boolean>(true)
  const [meters, setMeters] = useState<Meter[]>([])
  const [showDashboard, setShowDashboard] = useState<boolean>(false)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [userType] = useState<'consumer' | 'business' | 'admin'>('consumer') // Set based on login

  // Creates a new meter.
  // This function will run when the user clicks "OK" in the creation dialog.
  const handleCreateSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    try {
      setCreateLoading(true)

      // Dynamically import heavy SDKs only when needed
      const sdk = (await import('@babbage/sdk-ts')) as any
      const { createAction, createSignature, toBEEFfromEnvelope, getPublicKey } = sdk
      const bsvSdk = (await import('@bsv/sdk')) as any
      const { SHIPBroadcaster } = bsvSdk
      const backend = (await import('@bsv/backend')) as any
      const { MeterContract, MeterArtifact } = backend
      MeterContract.loadArtifact(MeterArtifact)
      const scrypt = (await import('scrypt-ts')) as any
      const { bsv, toByteString } = scrypt

      const pubKeyResult = await getPublicKey({ identityKey: true })

      const signature = await createSignature({
        data: new Uint8Array([1]),
        protocolID: [0, 'meter'],
        keyID: '1',
        counterparty: 'anyone'
      })
      const signatureHex = (bsvSdk.Utils && bsvSdk.Utils.toHex)
        ? bsvSdk.Utils.toHex(Array.from(new Uint8Array(signature)))
        : Buffer.from(signature).toString('hex')

      const meter = new MeterContract(
        BigInt(1),
        toByteString(pubKeyResult, false),
        toByteString(signatureHex, false)
      )
      const lockingScript = meter.lockingScript.toHex()

      const transactionEnvelope = await createAction({
        description: 'Create a meter',
        outputs: [{ script: lockingScript, satoshis: 1, description: 'meter output' }]
      })

      const beefTx = toBEEFfromEnvelope(transactionEnvelope as any)
      const broadcaster = new SHIPBroadcaster(['tm_meter'])
      const broadcastResult = await beefTx.tx.broadcast(broadcaster)
      console.log(broadcastResult)

      toast.dark('Meter successfully created!')
      setMeters((originalMeters) => ([
        {
          value: 1,
          creatorIdentityKey: pubKeyResult,
          token: { ...transactionEnvelope, rawTX: transactionEnvelope.rawTx, outputIndex: 0, lockingScript, satoshis: 1 } as Token
        },
        ...originalMeters
      ]))
      setCreateOpen(false)
    } catch (e) {
      toast.error((e as Error).message)
      console.error(e)
    } finally {
      setCreateLoading(false)
    }
  }

  // Load meters
  useAsyncEffect(async () => {
    // Dynamically import SDKs used for loading meters to avoid bundling them in initial payload
    const bsvSdk = (await import('@bsv/sdk')) as any
    const { LookupResolver, Transaction, ProtoWallet, Utils } = bsvSdk
    const backend = (await import('@bsv/backend')) as any
    const { MeterContract, MeterArtifact } = backend
    MeterContract.loadArtifact(MeterArtifact)
    const beefUtils = (await import('@babbage/sdk-ts/out/src/utils/toBEEF')) as any
    const { toEnvelopeFromBEEF } = beefUtils

    const anyoneWallet = new ProtoWallet('anyone')

    const resolver = new LookupResolver()
    const lookupResult = await resolver.query({ service: 'ls_meter', query: 'findAll' })
    if (lookupResult.type !== 'output-list') throw new Error('Wrong result type!')

    const parsedResults: Meter[] = []
    for (const result of lookupResult.outputs) {
      const tx = Transaction.fromBEEF(result.beef)
      const script = tx.outputs[result.outputIndex].lockingScript.toHex()
      const meter = MeterContract.fromLockingScript(script) as any
      const convertedToken = toEnvelopeFromBEEF(result.beef)

      const verifyResult = await anyoneWallet.verifySignature({
        protocolID: [0, 'meter'],
        keyID: '1',
        counterparty: meter.creatorIdentityKey,
        data: [1],
        signature: Utils.toArray(meter.creatorSignature, 'hex')
      })

      if (verifyResult.valid !== true) {
        throw new Error('Signature invalid')
      }

      parsedResults.push({
        value: Number(meter.count),
        creatorIdentityKey: String(meter.creatorIdentityKey),
        token: {
          ...convertedToken,
          rawTX: convertedToken.rawTx,
          txid: tx.id('hex'),
          outputIndex: result.outputIndex,
          lockingScript: script,
          satoshis: tx.outputs[result.outputIndex].satoshis as number
        } as Token
      })
    }

    setMeters(parsedResults)
    setMetersLoading(false)
  }, [])

  // Handle decrement
  const handleDecrement = async (meterIndex: number) => {
    const m = meters[meterIndex]

    // Dynamically import heavy libs used here
    const backend = (await import('@bsv/backend')) as any
    const { MeterContract } = backend
    const scrypt = (await import('scrypt-ts')) as any
    const { bsv } = scrypt
    const sdk = (await import('@babbage/sdk-ts')) as any
    const { createAction, toBEEFfromEnvelope } = sdk
    const bsvSdk = (await import('@bsv/sdk')) as any
    const { SHIPBroadcaster } = bsvSdk

    const meter = MeterContract.fromLockingScript(m.token.lockingScript)
    const nextMeter = MeterContract.fromLockingScript(m.token.lockingScript) as any
    nextMeter.decrement()
    const nextScript = nextMeter.lockingScript
    const parsedFromTx = new bsv.Transaction(m.token.rawTX)

    const unlockingScript = await meter.getUnlockingScript(async (self) => {
      const bsvtx = new bsv.Transaction()
      bsvtx.from({ txId: m.token.txid, outputIndex: m.token.outputIndex, script: m.token.lockingScript, satoshis: m.token.satoshis })
      bsvtx.addOutput(new bsv.Transaction.Output({ script: nextScript, satoshis: m.token.satoshis }))
      self.to = { tx: bsvtx, inputIndex: 0 }
      self.from = { tx: parsedFromTx, outputIndex: 0 }
      ; (self as any).decrementOnChain()
    })

    const broadcastActionParams = {
      inputs: {
        [m.token.txid]: {
          ...m.token,
          rawTx: m.token.rawTX,
          outputsToRedeem: [{ index: m.token.outputIndex, unlockingScript: unlockingScript.toHex(), spendingDescription: 'Previous counter token' }]
        }
      },
      outputs: [{ script: nextScript.toHex(), satoshis: m.token.satoshis, description: 'counter token' }],
      description: `Decrement a counter`,
      acceptDelayedBroadcast: false
    }

    let currentTX = await createAction(broadcastActionParams)
    const beefTx = toBEEFfromEnvelope(currentTX as any)
    const broadcastResult = await beefTx.tx.broadcast(new SHIPBroadcaster(['tm_meter']))
    console.log(broadcastResult)

    setMeters((originalMeters) => {
      const copy = [...originalMeters]
      copy[meterIndex].value--
      return copy
    })
  }

  // Handle increment
  const handleIncrement = async (meterIndex: number) => {
    const m = meters[meterIndex]

    // Dynamically import heavy libs used here
    const backend = (await import('@bsv/backend')) as any
    const { MeterContract } = backend
    const scrypt = (await import('scrypt-ts')) as any
    const { bsv } = scrypt
    const sdk = (await import('@babbage/sdk-ts')) as any
    const { createAction, toBEEFfromEnvelope } = sdk
    const bsvSdk = (await import('@bsv/sdk')) as any
    const { SHIPBroadcaster } = bsvSdk

    const meter = MeterContract.fromLockingScript(m.token.lockingScript)
    const nextMeter = MeterContract.fromLockingScript(m.token.lockingScript) as any
    nextMeter.increment()
    const nextScript = nextMeter.lockingScript
    const parsedFromTx = new bsv.Transaction(m.token.rawTX)

    const unlockingScript = await meter.getUnlockingScript(async (self) => {
      const bsvtx = new bsv.Transaction()
      bsvtx.from({ txId: m.token.txid, outputIndex: m.token.outputIndex, script: m.token.lockingScript, satoshis: m.token.satoshis })
      bsvtx.addOutput(new bsv.Transaction.Output({ script: nextScript, satoshis: m.token.satoshis }))
      self.to = { tx: bsvtx, inputIndex: 0 }
      self.from = { tx: parsedFromTx, outputIndex: 0 }
      ; (self as any).incrementOnChain()
    })

    const broadcastActionParams = {
      inputs: {
        [m.token.txid]: {
          ...m.token,
          rawTx: m.token.rawTX,
          outputsToRedeem: [{ index: m.token.outputIndex, unlockingScript: unlockingScript.toHex(), spendingDescription: 'Previous counter token' }]
        }
      },
      outputs: [{ script: nextScript.toHex(), satoshis: m.token.satoshis, description: 'counter token' }],
      description: `Increment a counter`,
      acceptDelayedBroadcast: false
    }

    let currentTX = await createAction(broadcastActionParams)
    const beefTx = toBEEFfromEnvelope(currentTX as any)
    const broadcastResult = await beefTx.tx.broadcast(new SHIPBroadcaster(['tm_meter']))
    console.log(broadcastResult)

    setMeters((originalMeters) => {
      const copy = [...originalMeters]
      copy[meterIndex].value++
      return copy
    })
  }

  // The rest of this file just contains some UI code. All the juicy
  // Bitcoin - related stuff is above.

  // ----------

  return (
    <>
      <ToastContainer
        position='top-right'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <AppBar position='static'>
        <Toolbar>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            Meter — Counters, Up and Down.
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<DashboardIcon />}
            onClick={() => setShowDashboard(!showDashboard)}
            sx={{ mr: 2 }}
          >
            {showDashboard ? 'Meters' : 'Dashboard'}
          </Button>
          <GitHubIconStyle onClick={() => window.open('https://github.com/p2ppsr/meter', '_blank')}>
            <GitHubIcon />
          </GitHubIconStyle>
        </Toolbar>
      </AppBar>
      <AppBarPlaceholder />

      {/* Dashboard Feature System */}
      {showDashboard ? (
        <Suspense fallback={<LoadingBar />}>
          {selectedFeature === 'photo-job-report' ? (
            <PhotoJobReport onBack={() => setSelectedFeature(null)} />
          ) : selectedFeature === 'pilot-signup' ? (
            <PilotSignup onBack={() => setSelectedFeature(null)} />
          ) : selectedFeature === 'advanced-leak-detection' ? (
            <div style={{ padding: '2em' }}>
              <Button onClick={() => setSelectedFeature(null)} sx={{ mb: 2 }}>← Back to Dashboard</Button>
              <Typography variant="h4" gutterBottom>Advanced Leak Detection</Typography>
              <Typography variant="body1" paragraph>
                This feature includes 5 breakthrough capabilities:
              </Typography>
              <ul>
                <li><strong>Smart Water Data Overlay</strong> - Real-time consumption analysis</li>
                <li><strong>Neighborhood Leak Mapping</strong> - Cross-property intelligence</li>
                <li><strong>3D Pipe Infrastructure</strong> - Complete digital twin</li>
                <li><strong>Acoustic Signature Analysis</strong> - AI-powered leak detection</li>
                <li><strong>Failure Hotspot Heat Map</strong> - Predictive maintenance</li>
              </ul>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Backend API endpoints are ready at /api/advanced-leak-detection/
              </Typography>
            </div>
          ) : selectedFeature === 'feature-history' ? (
            <FeatureHistory onBack={() => setSelectedFeature(null)} />
          ) : (
            <UnifiedDashboard 
              onFeatureSelect={(feature) => setSelectedFeature(feature)}
              userType={userType}
            />
          )}
        </Suspense>
      ) : (
        <>
          {meters.length >= 1 && (
            <AddMoreFab color='primary' onClick={() => { setCreateOpen(true) }}>
              <AddIcon />
            </AddMoreFab>
          )}

          {metersLoading
            ? (<LoadingBar />)
            : (
              <List>
                {meters.length === 0 && (
                  <NoItems container direction='column' justifyContent='center' alignItems='center'>
                    <Grid item align='center'>
                      <Typography variant='h4'>No Meters</Typography>
                      <Typography color='textSecondary'>
                        Use the button below to start a meter
                      </Typography>
                    </Grid>
                    <Grid item align='center' sx={{ paddingTop: '2.5em', marginBottom: '1em' }}>
                      <Fab color='primary' onClick={() => { setCreateOpen(true) }}>
                        <AddIcon />
                      </Fab>
                    </Grid>
                  </NoItems>
                )}
                {meters.map((x, i) => (
                  <ListItem key={i}>
                    <Button onClick={() => handleDecrement(i)}>Decrement</Button>
                    <Typography>{x.value}</Typography>
                    <Button onClick={() => handleIncrement(i)}>Increment</Button>
                    <IdentityCard
                      themeMode='dark'
                      identityKey={x.creatorIdentityKey}
                    />
                  </ListItem>
                ))}
              </List>
            )
          }

          {/* 3D VR Placeholder */}
          <div className="vr-section">
            <Typography variant='h5' sx={{ paddingTop: '1.5em' }}>3D VR Placeholder</Typography>
            <Suspense fallback={<div style={{ padding: '1em' }}>Loading 3D...</div>}>
              <VRPlaceholder />
            </Suspense>
          </div>
        </>
      )}

      <Dialog open={createOpen} onClose={() => { setCreateOpen(false) }}>
        <form onSubmit={(e) => {
          e.preventDefault()
          void (async () => {
            try {
              await handleCreateSubmit(e)
            } catch (error) {
              console.error('Error in form submission:', error)
            }
          })()
        }}>
          <DialogTitle>Create a Meter</DialogTitle>
          <DialogContent>
            <DialogContentText paragraph>
              Meters can be incremented and decremented after creation.
            </DialogContentText>
          </DialogContent>
          {createLoading
            ? (<LoadingBar />)
            : (
              <DialogActions>
                <Button onClick={() => { setCreateOpen(false) }}>Cancel</Button>
                <Button type='submit'>OK</Button>
              </DialogActions>
            )
          }
        </form>
      </Dialog>
    </>
  )
}

export default App
