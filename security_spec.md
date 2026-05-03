# Aurora Security Specification

## Data Invariants
- A Product must have a name, price, category, and at least one image.
- An Order must have customer contact details and a list of items with total calculation.
- An Admin document can only be created or modified by an existing Admin.
- A Notification is linked to a phone number or order and created by an Admin.

## The "Dirty Dozen" Payloads (Denial Tests)
1.  **Identity Spoofing:** Attempt to create an Admin document with a random UID.
2.  **Price Manipulation:** Attempt to update a Product's price as a non-admin.
3.  **Order Injection:** Attempt to create an Order with a negative total.
4.  **Admin Escalation:** Attempt to add oneself to the `admins` collection without being an admin.
5.  **PII Leak:** Attempt to read all Orders as an unauthenticated user.
6.  **Status Shortcut:** Attempt to mark an Order as `delivered` from the client without being an admin.
7.  **Resource Poisoning:** Attempt to use a 2MB string as a Product name.
8.  **Orphaned Order:** Create an Order with a `productId` that does not exist.
9.  **Timestamp Spoofing:** Create a Product with a `createdAt` in the future.
10. **Notification Spam:** Create a Notification as a non-admin.
11. **Bulk Delete:** Attempt to delete the entire `products` collection.
12. **Shadow Field:** Update a product with an `isFeatured` field not in the schema.

## Firestore Rules Drafting
I will now implement these constraints in `firestore.rules`.
