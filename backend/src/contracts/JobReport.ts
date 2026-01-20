import {
    assert,
    ByteString,
    Sig,
    PubKey,
    hash256,
    method,
    prop,
    SmartContract,
    SigHash
} from 'scrypt-ts'

/**
 * JobReport stores immutable records of plumbing jobs
 * Contains work description, costs, completion status
 */
export class JobReport extends SmartContract {
    @prop(true)
    jobId: ByteString // Unique job identifier

    @prop(true)
    propertyId: ByteString // Associated property

    @prop(true)
    customerPublicKey: PubKey

    @prop(true)
    plumberPublicKey: PubKey

    @prop(true)
    reportHash: ByteString // Hash of full report (work desc, photos, costs)

    @prop(true)
    createdAt: bigint // Job start time

    @prop(true)
    completedAt: bigint // Job completion time (0 if incomplete)

    @prop(true)
    cost: bigint // In satoshis

    @prop(true)
    status: ByteString // "pending", "completed", "approved"

    @prop(true)
    customerApproved: boolean

    @prop(true)
    photoHashes: ByteString // SHA-256 hashes of all photos (comma-separated)

    @prop(true)
    photoCount: bigint // Number of photos attached

    @prop(true)
    videoHashes: ByteString // SHA-256 hashes of videos (comma-separated)

    @prop(true)
    digitalTwinData: ByteString // JSON with 3D coordinates of work location

    @prop(true)
    smartMeterDataHash: ByteString // Hash of smart meter readings overlay

    @prop(true)
    neighborLeakDataHash: ByteString // Hash of neighborhood leak correlation data

    @prop(true)
    pipeInfrastructureHash: ByteString // Hash of 3D pipe mapping data

    @prop(true)
    acousticSignatureHash: ByteString // Hash of acoustic leak analysis

    @prop(true)
    failureHotspotHash: ByteString // Hash of failure hotspot heat map data

    @prop(true)
    consentRecordsHash: ByteString // Hash of data sharing consent records

    @prop(true)
    dataTimestamp: bigint // Timestamp when all data was captured

    constructor(
        jobId: ByteString,
        propertyId: ByteString,
        customerPublicKey: PubKey,
        plumberPublicKey: PubKey,
        reportHash: ByteString,
        createdAt: bigint,
        completedAt: bigint,
        cost: bigint,
        status: ByteString,
        customerApproved: boolean,
        photoHashes: ByteString,
        photoCount: bigint,
        videoHashes: ByteString,
        digitalTwinData: ByteString,
        smartMeterDataHash: ByteString,
        neighborLeakDataHash: ByteString,
        pipeInfrastructureHash: ByteString,
        acousticSignatureHash: ByteString,
        failureHotspotHash: ByteString,
        consentRecordsHash: ByteString,
        dataTimestamp: bigint
    ) {
        super(...arguments)
        this.jobId = jobId
        this.propertyId = propertyId
        this.customerPublicKey = customerPublicKey
        this.plumberPublicKey = plumberPublicKey
        this.reportHash = reportHash
        this.createdAt = createdAt
        this.completedAt = completedAt
        this.cost = cost
        this.status = status
        this.customerApproved = customerApproved
        this.photoHashes = photoHashes
        this.photoCount = photoCount
        this.videoHashes = videoHashes
        this.digitalTwinData = digitalTwinData
        this.smartMeterDataHash = smartMeterDataHash
        this.neighborLeakDataHash = neighborLeakDataHash
        this.pipeInfrastructureHash = pipeInfrastructureHash
        this.acousticSignatureHash = acousticSignatureHash
        this.failureHotspotHash = failureHotspotHash
        this.consentRecordsHash = consentRecordsHash
        this.dataTimestamp = dataTimestamp
    }

    /**
     * Mark job as completed
     * Plumber submits final report hash
     */
    @method(SigHash.ANYONECANPAY_SINGLE)
    public completeJob(
        finalReportHash: ByteString,
        completionTime: bigint,
        finalCost: bigint,
        plumberSig: Sig
    ) {
        // Verify plumber signature
        assert(
            this.checkSig(plumberSig, this.plumberPublicKey),
            'Invalid plumber signature'
        )

        // Verify times are logical
        assert(completionTime >= this.createdAt, 'Completion time must be after creation')
        assert(finalCost > 0n, 'Cost must be positive')

        // Update state
        this.reportHash = finalReportHash
        this.completedAt = completionTime
        this.cost = finalCost
        this.status = ('0x636f6d706c657465642020202020' as unknown as ByteString) // "completed" in hex

        const amount: bigint = this.ctx.utxo.value
        const outputs: ByteString = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    /**
     * Customer approves completed job
     */
    @method(SigHash.ANYONECANPAY_SINGLE)
    public approveJob(customerSig: Sig) {
        assert(
            this.checkSig(customerSig, this.customerPublicKey),
            'Invalid customer signature'
        )

        assert(this.completedAt > 0n, 'Job must be completed first')

        this.customerApproved = true
        this.status = ('0x617070726f76656420202020202020' as unknown as ByteString) // "approved" in hex

        const amount: bigint = this.ctx.utxo.value
        const outputs: ByteString = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    /**
     * Verify report integrity
     */
    @method()
    public verifyReport(reportData: ByteString): boolean {
        const calculatedHash: ByteString = hash256(reportData)
        return calculatedHash == this.reportHash
    }

    /**
     * Check if job is fully completed and approved
     */
    @method()
    public isApproved(): boolean {
        return this.customerApproved && this.completedAt > 0n
    }
}
