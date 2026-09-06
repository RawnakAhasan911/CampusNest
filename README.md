# Student Housing & Roommate Finder (CampusNest EduSec)

A full-stack, security-first web application designed for university students to find verified housing and highly compatible roommates. Built from scratch with a **Zero-Library Dual-Asymmetric Cryptographic Architecture**.

---

## 🔒 Critical Security & Cryptography Compliance

This platform strictly enforces all mandatory cryptographic constraints with **zero external crypto libraries or built-in framework helpers** (no `crypto`, `node:crypto`, `bcrypt`, `openssl`, `WebCrypto`, or npm cryptographic wrappers). Every primitive is custom-implemented in pure JavaScript using native `BigInt` modular arithmetic and bitwise unsigned logic:

| Security Requirement | Implementation | Custom Module |
| :--- | :--- | :--- |
| **Strict Asymmetric Only** | **Exclusively Asymmetric Encryption**. Zero symmetric ciphers (no AES, 3DES, RC4). | [`rsa.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/crypto/rsa.js), [`ecc.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/crypto/ecc.js) |
| **Two Different Asymmetric Ciphers** | **Algorithm 1:** RSA-512 with PKCS#1 v1.5 chunking.<br>**Algorithm 2:** ECC secp256k1 (EC-ElGamal point operations). | [`encryptionService.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/crypto/encryptionService.js) |
| **Data-at-Rest Encryption** | All sensitive fields (Name, Email, Phone, Dept, Bio, Listings, Private Keys) are stored as ciphertext blocks. | [`User.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/models/User.js), [`Listing.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/models/Listing.js) |
| **Integrity Authentication (MAC)** | **RFC 2104 HMAC-SHA256** for encrypted records and **CBC-MAC** for property images and metadata. | [`hmac.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/crypto/hmac.js) |
| **Two-Step Authentication (2FA)** | Validates primary credentials (email/password) + second factor (6-digit OTP encrypted with system ECC). | [`authRoutes.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/routes/authRoutes.js) |
| **Key Management Module (KMM)** | Key generation, public registry distribution, secure database storage, and dynamic versioned rotation. | [`keyManager.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/crypto/keyManager.js) |
| **Password Salting & Hashing** | Custom **PBKDF2-HMAC-SHA256** with 2048 iterations and 128-bit random salt. | [`kdf.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/crypto/kdf.js) |
| **Anti-Hijacking Sessions** | Signed tokens with User-Agent fingerprinting and immediate server-side revocation on logout. | [`sessionManager.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/middleware/sessionManager.js) |
| **Role-Based Access Control** | Least-privilege separation between `admin` and `student` roles. | [`rbac.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/middleware/rbac.js) |
| **Cryptographic PRNG** | Continuous hardware timing jitter & high-resolution monotonic timer entropy accumulator (Hash-DRBG). | [`prng.js`](file:///home/raw911/Documents/CSE447/447_project/backend/src/crypto/prng.js) |

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client[React + Tailwind Single Page Application] -->|REST API + Anti-Hijack Token| Gateway[Express Application Server]
    
    subgraph Security & Cryptography Engine [Pure Custom JS Primitives]
        RSA[Algorithm 1: RSA-512 + PKCS#1 v1.5]
        ECC[Algorithm 2: ECC secp256k1 EC-ElGamal]
        KDF[PBKDF2-HMAC-SHA256 Password Hash]
        MAC[HMAC-SHA256 & CBC-MAC Verification]
        KMM[Key Management Module: Gen / Dist / Rotate]
        PRNG[Hardware Jitter Entropy Accumulator]
    end

    Gateway --> Security & Cryptography Engine
    Security & Cryptography Engine -->|Ciphertext Only + MACs| DB[(MongoDB Storage)]
```

---

## 🔑 Demo Accounts & Credentials

The database is pre-seeded with realistic student profiles, housing listings, and an administrator:

| Role | University Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@university.edu` | `AdminPassword123!` | Housing authority admin with full moderation & KMM rotation controls. |
| **Student (CS)** | `alex@university.edu` | `StudentPass123!` | Junior, clean, quiet, non-smoker. Posted 2BR North Campus apartment. |
| **Student (ME)** | `brianna@university.edu` | `StudentPass123!` | Junior, early bird, clean, non-smoker. **96% compatibility with Alex!** |
| **Student (Business)** | `marcus@university.edu` | `StudentPass123!` | Senior, social, night owl, dog owner. Posted Downtown Studio. |
| **Student (Pre-Med)** | `diana@university.edu` | `StudentPass123!` | Sophomore, quiet, cat owner. Posted Eastside Townhouse bedroom. |

> [!TIP]
> During login or registration, the 2FA / verification OTP is displayed in the UI banner and browser console for instant testing convenience.

---

## 🚀 Quick Setup & Execution

### Prerequisites
- Node.js (v18+)
- MongoDB (running on `localhost:27017` or via Docker: `docker run -d -p 27017:27017 mongo`)

### 1. Installation
Dependencies are already installed in both `backend` and `frontend`. To reinstall if needed:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start the Application
From the root directory, run:
```bash
npm start
```
The server will start on port **5000** and serve both the REST API and the compiled React frontend:
- Web App UI: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`
- Cryptographic Registry: `http://localhost:5000/api/crypto/registry`

### 3. Run Cryptographic Verification Test Suite
Execute the 31-point mathematical and security test suite:
```bash
npm run test:crypto
```

---

## 📦 Functional Requirements Walkthrough

### 1. User Authentication & 2FA
- **University Email Domain Rule**: Enforces `.edu` / `.ac.*` validation during registration.
- **2-Step Login**: Step 1 validates email and PBKDF2 password hash. Step 2 requires the ECC-encrypted OTP before issuing a session token.
- **Session Protection**: Tokens are bound to client User-Agent hashes and revoked upon logout.

### 2. Student Profile & Lifestyle Management
- Captures department, year of study, age range, budget, and move-in date.
- Tracks 8 lifestyle dimensions: Smoking, Pets, Sleep schedule, Cleanliness, Noise, Cooking, Guests, and Study habits.
- **Privacy Controls**: Phone number is hidden by default; students can toggle public visibility flags.

### 3. Housing Listing Management
- Create, view, edit, and delete listings.
- Images uploaded with **CBC-MAC** integrity tags to detect image alteration.
- Mark listings as "Rented / Unavailable" to immediately remove them from active search.

### 4. Housing Search & Multi-Faceted Filters
- Real-time search by keywords, campus area, rent range sliders, bedrooms, bathrooms, and furnished status.

### 5. Roommate Compatibility Matching Algorithm
- Evaluates multi-dimensional lifestyle vectors to compute a deterministic **0% to 100% compatibility score**.
- Categorizes matches as *Exceptional* (≥90%), *Great* (≥75%), *Good* (≥60%), or *Moderate*.
- Breaks down shared factors and differing habits.

### 6. Roommate Request Management
- Send connection requests with **ECC-encrypted introduction notes**.
- Prevents self-requests and duplicate connections.
- Statuses: *Pending*, *Accepted*, *Declined*, *Cancelled*.

### 7. Peer-to-Peer Encrypted Messaging
- Prerequisite: Allowed **only** between students with an *Accepted* roommate connection.
- **Pure EC-ElGamal Asymmetric Encryption**: Messages are encrypted using the recipient's public curve point $(x, y)$ on secp256k1.
- Each message carries an HMAC-SHA256 authentication tag to guarantee integrity.

### 8. Favourites / Saved Listings
- One-click bookmarking of listings with quick access from the dashboard.

### 9. Reviews & Rating System
- 1 to 5 star ratings and reviews restricted to connected roommates.
- Reviews can be reported to administrators.

### 10. Automated In-App Notifications
- Alerts for roommate requests received, status updates, new encrypted messages, and new housing matches.

### 11. Report & Safety System
- Report users or listings with encrypted statements.
- Block users to prevent unsolicited requests or messages.

### 12. Admin Console & Key Management (KMM)
- RBAC protected dashboard for administrators.
- Moderate users (suspend/activate), listings, reports, and categories.
- **KMM Panel**: Displays active RSA and ECC key versions, public fingerprints, and allows triggering on-demand **Cryptographic Key Rotation**.
