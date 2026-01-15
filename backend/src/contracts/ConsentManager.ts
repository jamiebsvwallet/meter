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
 * ConsentManager tracks data access permissions
 * Customer grants/revokes access to real-time IoT data and job reports
 */
export class ConsentManager extends SmartContract {
    @prop(true)
    propertyId: ByteString

    @prop(true)
    customerPublicKey: PubKey

    @prop(true)
    plumberConsent: boolean // Plumber always has default consent

    @prop(true)
    waterCompanyConsents: ByteString // Encoded map of water company key -> bool

    @prop(true)
    lastConsentUpdate: bigint

    @prop(true)
    consentLog: ByteString // Audit trail of consent changes

    constructor(
        propertyId: ByteString,
        customerPublicKey: PubKey,
        plumberConsent: boolean,
        waterCompanyConsents: ByteString,
        lastConsentUpdate: bigint,
        consentLog: ByteString
    ) {
        super(...arguments)
        this.propertyId = propertyId
        this.customerPublicKey = customerPublicKey
        this.plumberConsent = plumberConsent
        this.waterCompanyConsents = waterCompanyConsents
        this.lastConsentUpdate = lastConsentUpdate
        this.consentLog = consentLog
    }

    /**
     * Grant water company access to property data
     * Customer must sign consent
     */
    @method(SigHash.ANYONECANPAY_SINGLE)
    public grantWaterCompanyAccess(
        waterCompanyKey: ByteString,
        customerSig: Sig,
        reason: ByteString
    ) {
        assert(
            this.checkSig(customerSig, this.customerPublicKey),
            'Only customer can grant access'
        )

        // Add company to consent list
        this.waterCompanyConsents = this.waterCompanyConsents + waterCompanyKey

        // Log the change
        const timestamp = BigInt(Date.now())
        this.consentLog = this.consentLog + waterCompanyKey + reason + timestamp

        this.lastConsentUpdate = timestamp

        const amount: bigint = this.ctx.utxo.value
        const outputs: ByteString = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    /**
     * Revoke water company access
     */
    @method(SigHash.ANYONECANPAY_SINGLE)
    public revokeWaterCompanyAccess(
        waterCompanyKey: ByteString,
        customerSig: Sig
    ) {
        assert(
            this.checkSig(customerSig, this.customerPublicKey),
            'Only customer can revoke access'
        )

        // Remove from consents (in production, use proper data structure)
        this.waterCompanyConsents = '' as unknown as ByteString

        const timestamp = BigInt(Date.now())
        this.consentLog = this.consentLog + waterCompanyKey + ('0x72657665' as unknown as ByteString) + timestamp

        this.lastConsentUpdate = timestamp

        const amount: bigint = this.ctx.utxo.value
        const outputs: ByteString = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    /**
     * Check if entity has access
     */
    @method()
    public hasAccess(entityKey: ByteString): boolean {
        // Customer always has access
        if (entityKey == this.customerPublicKey) return true

        // Plumber has default access
        if (this.plumberConsent) return true

        // Check water company consents
        // Simplified check - in production use merkle tree or similar
        return false
    }

    /**
     * Get audit trail of all consent changes
     */
    @method()
    public getConsentAuditTrail(): ByteString {
        return this.consentLog
    }
}
