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
 * IoTDataProof stores cryptographic proof of IoT sensor readings
 * Actual sensor data is stored off-chain, only hash + timestamp on-chain
 */
export class IoTDataProof extends SmartContract {
    @prop(true)
    propertyId: ByteString // Link to property

    @prop(true)
    dataHash: ByteString // Hash of sensor readings batch

    @prop(true)
    timestamp: bigint // When data was recorded

    @prop(true)
    deviceId: ByteString // Which device(s) provided data

    @prop(true)
    recordCount: bigint // Number of readings in this batch

    @prop(true)
    recordedBy: PubKey // Plumber's public key who submitted

    constructor(
        propertyId: ByteString,
        dataHash: ByteString,
        timestamp: bigint,
        deviceId: ByteString,
        recordCount: bigint,
        recordedBy: PubKey
    ) {
        super(...arguments)
        this.propertyId = propertyId
        this.dataHash = dataHash
        this.timestamp = timestamp
        this.deviceId = deviceId
        this.recordCount = recordCount
        this.recordedBy = recordedBy
    }

    /**
     * Append a new batch of IoT readings
     * Plumber submits hash of current readings
     */
    @method(SigHash.ANYONECANPAY_SINGLE)
    public recordReadings(
        newDataHash: ByteString,
        newTimestamp: bigint,
        newRecordCount: bigint,
        plumberSig: Sig
    ) {
        // Verify plumber signature
        assert(
            this.checkSig(plumberSig, this.recordedBy),
            'Invalid plumber signature'
        )

        // Timestamp must be after previous
        assert(newTimestamp > this.timestamp, 'Timestamp must be after previous')

        // Update state
        this.dataHash = newDataHash
        this.timestamp = newTimestamp
        this.recordCount = newRecordCount

        const amount: bigint = this.ctx.utxo.value
        const outputs: ByteString = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    /**
     * Verify data integrity - hash matches known data
     * Off-chain system uses this to verify data hasn't been tampered
     */
    @method()
    public verifyDataHash(providedData: ByteString): boolean {
        const calculatedHash: ByteString = hash256(providedData)
        return calculatedHash == this.dataHash
    }

    /**
     * Get proof details for verification
     */
    @method()
    public getProof(): ByteString {
        // Return serialized proof data
        return this.dataHash + this.timestamp
    }
}
