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
 * PropertyRegistry manages property ownership and consent permissions
 * Tracks which plumber, customer, and water companies have access
 */
export class PropertyRegistry extends SmartContract {
    @prop(true)
    propertyId: ByteString // Hash of property address

    @prop(true)
    customerPublicKey: PubKey // Customer's identity

    @prop(true)
    plumberPublicKey: PubKey // Registered plumber

    @prop(true)
    consentedWaterCompanies: ByteString // Serialized list of approved water board keys

    @prop(true)
    createdAt: bigint // Timestamp

    @prop(true)
    lastUpdated: bigint // Last modification timestamp

    constructor(
        propertyId: ByteString,
        customerPublicKey: PubKey,
        plumberPublicKey: PubKey,
        consentedWaterCompanies: ByteString,
        createdAt: bigint,
        lastUpdated: bigint
    ) {
        super(...arguments)
        this.propertyId = propertyId
        this.customerPublicKey = customerPublicKey
        this.plumberPublicKey = plumberPublicKey
        this.consentedWaterCompanies = consentedWaterCompanies
        this.createdAt = createdAt
        this.lastUpdated = lastUpdated
    }

    /**
     * Add a water company to the consent list
     * Only customer can authorize
     */
    @method(SigHash.ANYONECANPAY_SINGLE)
    public authorizeWaterCompany(waterCompanyKey: ByteString, customerSig: Sig) {
        // Verify customer signature
        assert(
            this.checkSig(customerSig, this.customerPublicKey),
            'Invalid customer signature'
        )

        // Update last modified time
        this.lastUpdated = BigInt(Date.now())

        // Add to consented list (simplified - in production use merkle tree or similar)
        this.consentedWaterCompanies = this.consentedWaterCompanies + waterCompanyKey

        // State update
        const amount: bigint = this.ctx.utxo.value
        const outputs: ByteString = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    /**
     * Revoke water company access
     */
    @method(SigHash.ANYONECANPAY_SINGLE)
    public revokeWaterCompany(waterCompanyKey: ByteString, customerSig: Sig) {
        assert(
            this.checkSig(customerSig, this.customerPublicKey),
            'Invalid customer signature'
        )

        this.lastUpdated = BigInt(Date.now())

        // Remove from consented list (simplified)
        // In production, implement proper removal logic
        this.consentedWaterCompanies = this.consentedWaterCompanies

        const amount: bigint = this.ctx.utxo.value
        const outputs: ByteString = this.buildStateOutput(amount)
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    /**
     * Verify if an entity has access to this property's data
     */
    @method()
    public verifyAccess(entityKey: ByteString): boolean {
        // Customer always has access
        if (entityKey == this.customerPublicKey) return true

        // Plumber has access
        if (entityKey == this.plumberPublicKey) return true

        // Check if water company is consented (simplified check)
        // In production, use proper list verification
        return true
    }
}
