export const matterName = 'Aster Works v. Banyan Projects'
export const matterReference = 'MD-026-2026'
export const agreementRecordsClause =
  'Each party will keep the signed agreement and a delivery receipt for each shipment.'
export const categories = [
  'Core documents',
  'Supporting documents',
  'Evidence',
  'Additional material',
] as const
export const documents = [
  {
    name: 'Petition',
    pages: 18,
    part: 0,
    heading: 'Application to add delivery records',
    excerpt:
      'Aster Works asks the court to accept the supply agreement, delivery receipt and 25 March email as part of the case record.',
    reviewNote: 'Cross-check the three documents against the bundle index.',
    recordNote: 'Filed on 7 April 2026 by Ananya Rao, authorised representative.',
  },
  {
    name: 'Affidavit',
    pages: 24,
    part: 0,
    heading: 'Statement of receipt',
    excerpt:
      'I, Mira Desai, checked the signed delivery receipt against the stock register. Banyan Projects received 180 steel brackets on 24 March 2026.',
    reviewNote: 'Compare the quantity with the signed delivery receipt.',
    recordNote: 'Statement signed on 6 April 2026.',
  },
  {
    name: 'Agreement',
    pages: 39,
    part: 1,
    heading: '3. Delivery and records',
    excerpt:
      'On 14 March 2026, Aster Works agreed to supply 240 steel brackets to Banyan Projects by 24 March 2026.',
    reviewNote: 'Check the delivery date against the signed receipt.',
    recordNote: `3.2. ${agreementRecordsClause}`,
  },
  {
    name: 'Correspondence',
    pages: 27,
    part: 1,
    heading: '25 March 2026 · Delivery enquiry',
    excerpt:
      'We received 180 of the 240 steel brackets ordered. Please confirm when the remaining 60 units will arrive.',
    reviewNote: 'Keep this email with the receipt it refers to.',
    recordNote: 'From Banyan Projects to the Aster Works dispatch team.',
  },
  {
    name: 'Evidence',
    pages: 52,
    part: 2,
    heading: 'Signed delivery receipt DN-184',
    excerpt:
      'The receipt records 180 steel brackets delivered to the Banyan Projects store on 24 March 2026.',
    reviewNote: 'Check the received quantity against purchase order PO-116.',
    recordNote: 'The storekeeper acknowledged receipt on the day of delivery.',
  },
  {
    name: 'Additional records',
    pages: 36,
    part: 3,
    heading: 'Purchase ledger · PO-116',
    excerpt:
      'The ledger shows 240 steel brackets ordered, 180 received against DN-184, and 60 outstanding at the end of March.',
    reviewNote: 'Retain the cross-reference to the delivery receipt.',
    recordNote: 'Ledger entries cover 14–31 March 2026.',
  },
]
export function numberDocuments(files: typeof documents) {
  let next = 1
  return files.map((file) => {
    const start = next
    next += file.pages
    return { ...file, start, end: next - 1 }
  })
}
export const numberedDocuments = numberDocuments(documents)
