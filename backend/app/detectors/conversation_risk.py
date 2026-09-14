def analyze_conversation_risk(transcript: str, sensitive_action: str = '', transaction_amount: float = 0.0) -> dict:
    """
    Feature 8: Multilingual Conversation Risk Analysis (English, Hindi & Hinglish).
    Scans transcripts for social engineering patterns, OTP fraud, urgency pressure,
    and unauthorized financial diversion tactics.
    """
    if not transcript:
        transcript = ''

    text = transcript.lower()
    flags = []
    
    # 1. OTP / 2FA Requests (English + Hindi / Hinglish)
    otp_keywords = [
        'otp', 'one-time password', 'verification code', 'auth code', 'security pin', 
        'sms code', '6-digit code', 'six digit', 'code bataiye', 'code bheja hai', 
        'otp batao', 'otp share karo', 'paanch digit', 'chheh digit', 'message ka code',
        'otp send kiya', 'code aayega'
    ]
    otp_matches = [w for w in otp_keywords if w in text]
    otp_risk = 85 if otp_matches else 0
    if otp_matches:
        flags.append({
            'category': 'OTP_REQUEST',
            'severity': 'HIGH',
            'description': f'Direct solicitation of authentication credentials / OTP ({", ".join(otp_matches[:2])})',
            'weight': 35
        })

    # 2. Password / Secret Credential Requests (English + Hindi)
    cred_keywords = [
        'password', 'secret key', 'passphrase', 'private key', 'login credentials', 
        'master password', 'pin number', 'upi pin', 'atm pin', 'pin bataiye', 'pin enter karo'
    ]
    cred_matches = [w for w in cred_keywords if w in text]
    cred_risk = 90 if cred_matches else 0
    if cred_matches:
        flags.append({
            'category': 'CREDENTIAL_THEFT',
            'severity': 'HIGH',
            'description': f'Attempted extraction of confidential security secrets / PIN ({", ".join(cred_matches[:2])})',
            'weight': 40
        })

    # 3. Financial Transfers & Fund Redirection (English + Hindi)
    financial_keywords = [
        'transfer', 'wire', 'rupees', 'inr', 'usd', 'dollars', 'payment', 'bank account', 
        'neft', 'rtgs', 'upi', 'send money', 'deposit', '₹', '$', 'rupaye', 'bhejo', 
        'khata', 'paise transfer', 'paise bhejiye', 'account mein daalo', 'gpay', 'phonepe', 'paytm'
    ]
    fin_matches = [w for w in financial_keywords if w in text] or transaction_amount > 0
    if fin_matches or transaction_amount > 0:
        amount_note = f' (Amount: ₹{transaction_amount:,.2f})' if transaction_amount > 0 else ''
        fin_risk = 80 if (transaction_amount > 25000 or len(fin_matches) >= 2) else 50
        flags.append({
            'category': 'FINANCIAL_REQUEST',
            'severity': 'HIGH' if fin_risk > 70 else 'MEDIUM',
            'description': f'Monetary transfer or fund redirection solicitation{amount_note}',
            'weight': 30
        })
    else:
        fin_risk = 0

    # 4. Urgency & Coercive Pressure Tactics (English + Hindi / Hinglish)
    urgency_keywords = [
        'immediately', 'right now', 'urgent', 'emergency', 'without delay', 'hurry', 
        'fast', 'freeze', 'cancelled', 'deadline', 'critical', 'asap', 'turant', 
        'jaldi', 'abhi ke abhi', 'fatafat', 'block ho jayega', 'suspend ho jayega', 
        'band ho jayega', 'time nahi hai'
    ]
    urgency_matches = [w for w in urgency_keywords if w in text]
    urgency_risk = 80 if len(urgency_matches) >= 2 else (50 if urgency_matches else 0)
    if urgency_matches:
        flags.append({
            'category': 'PSYCHOLOGICAL_URGENCY',
            'severity': 'HIGH' if urgency_risk > 65 else 'MEDIUM',
            'description': f'Coercive urgency indicators designed to bypass verification ({", ".join(urgency_matches[:3])})',
            'weight': 25
        })

    # 5. Protocol Bypass / Enforced Secrecy (English + Hindi / Hinglish)
    bypass_keywords = [
        "don't tell", "do not tell", 'bypass', 'skip verification', 'keep this confidential', 
        'between us', 'skip protocol', 'override', 'call nobody', "don't call",
        'kisi ko mat batana', 'kisi ko mat bolo', 'call mat karna', 'branch mat jao', 
        'direct mujhe batao', 'kisi se baat mat karo'
    ]
    bypass_matches = [w for w in bypass_keywords if w in text]
    bypass_risk = 90 if bypass_matches else 0
    if bypass_matches:
        flags.append({
            'category': 'VERIFICATION_BYPASS',
            'severity': 'CRITICAL',
            'description': f'Explicit command to bypass standard authorization checks or observe secrecy ({", ".join(bypass_matches[:2])})',
            'weight': 35
        })

    # 6. Authority & Executive Impersonation (English + Hindi)
    authority_keywords = [
        'ceo', 'cfo', 'director', 'managing director', 'chairman', 'board', 'headquarters', 
        'president', 'police', 'tax inspector', 'manager bol raha hoon', 'cbi officer', 
        'crime branch', 'customs department', 'head office se', 'bank manager', 'income tax'
    ]
    auth_matches = [w for w in authority_keywords if w in text]
    if auth_matches:
        flags.append({
            'category': 'AUTHORITY_IMPERSONATION',
            'severity': 'HIGH',
            'description': f'Caller claiming organizational or law enforcement authority ({", ".join(auth_matches[:2])})',
            'weight': 25
        })

    if not flags:
        behavior_score = 12
    else:
        total_weight = sum(f['weight'] for f in flags)
        behavior_score = min(98, max(25, total_weight))

    return {
        'behavior_risk': behavior_score,
        'otp_risk': otp_risk,
        'financial_risk': fin_risk,
        'urgency_risk': urgency_risk,
        'bypass_risk': bypass_risk,
        'flags': flags,
        'flags_count': len(flags)
    }
