/**
 * Security Rules Verification Suite for Dirty Dozen Payloads
 * Intended for validation against @firebase/rules-unit-testing in an emulator environment.
 */

export const DIRTY_DOZEN_PAYLOADS = [
  {
    name: '1. Poisoned Document ID',
    collection: 'offers',
    docId: 'bad id with $pecial chars!!',
    payload: { id: 'bad', operator: 'GP', title: 'Test', category: 'combo', regularPrice: 100, offerPrice: 80, validity: '7d', division: 'All', active: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Shadow Field Injection on PortalUser',
    collection: 'portal_users',
    docId: 'u_shadow',
    payload: { id: 'u_shadow', name: 'Test', phone: '01700000000', email: 't@t.com', role: 'user', balance: 0, createdAt: '2026-01-01T00:00:00Z', isRoot: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Plaintext Password Storage Attempt',
    collection: 'portal_users',
    docId: 'u_plain',
    payload: { id: 'u_plain', name: 'Test', phone: '01700000000', email: 't@t.com', role: 'user', balance: 0, password: 'plaintext_password', createdAt: '2026-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Invalid Role Enum',
    collection: 'portal_users',
    docId: 'u_role',
    payload: { id: 'u_role', name: 'Test', phone: '01700000000', email: 't@t.com', role: 'superuser', balance: 0, createdAt: '2026-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Negative Balance',
    collection: 'portal_users',
    docId: 'u_neg',
    payload: { id: 'u_neg', name: 'Test', phone: '01700000000', email: 't@t.com', role: 'user', balance: -50, createdAt: '2026-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Zero/Negative Add Money Amount',
    collection: 'add_money_requests',
    docId: 'am_neg',
    payload: { id: 'am_neg', userId: 'u1', userName: 'A', userPhone: '01700000000', method: 'bKash', senderNumber: '01700000000', amount: -100, trxId: 'TRX1', status: 'pending', timestamp: '2026-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Oversized Title Poisoning',
    collection: 'offers',
    docId: 'off_long',
    payload: { id: 'off_long', operator: 'GP', title: 'X'.repeat(500), category: 'combo', regularPrice: 100, offerPrice: 80, validity: '7d', division: 'All', active: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Invalid Payment Method Enum',
    collection: 'add_money_requests',
    docId: 'am_bad_method',
    payload: { id: 'am_bad_method', userId: 'u1', userName: 'A', userPhone: '01700000000', method: 'Bitcoin', senderNumber: '01700000000', amount: 100, trxId: 'TRX1', status: 'pending', timestamp: '2026-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Immutable Order Owner Tampering (Update)',
    collection: 'nid_orders',
    docId: 'nid_101',
    operation: 'update',
    payload: { userId: 'attacker-uid' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Unbounded File Chunk Overflow',
    collection: 'portal_files',
    docId: 'f_overflow',
    payload: { id: 'f_overflow', fileId: 'f1', chunkIndex: 0, totalChunks: 500, fileName: 'x.pdf', chunkData: 'abc', createdAt: '2026-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Missing Required Array Field on DigitalService',
    collection: 'digital_services',
    docId: 'srv_bad',
    payload: { id: 'srv_bad', title: 'Bad Service', description: 'desc', fee: 10, category: 'nid', icon: 'FileText', active: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Unlisted Collection Access',
    collection: 'internal_secrets',
    docId: 'sec_1',
    payload: { key: '1234' },
    expected: 'PERMISSION_DENIED',
  },
];
