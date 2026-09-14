# 🛡️ VoxCipher – Adaptive Voice Impersonation Defense

<p align="center">
  <img src="https://img.shields.io/badge/VoxCipher-v1.0.0-00E5FF?style=for-the-badge&logo=shield&logoColor=white" alt="Version" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Tests-11%20Passed-brightgreen?style=for-the-badge&logo=pytest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>An enterprise-grade Cybersecurity SOC platform engineered to detect, analyze, and intercept generative AI voice clones, deepfake audio impersonation, telephony codec attacks, and executive social engineering in real-time.</strong>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture & Zero-Trust Pipeline](#-architecture--zero-trust-pipeline)
- [Multi-Layer Defense Matrix](#-multi-layer-defense-matrix)
- [Key Capabilities](#-key-capabilities)
- [Telephony & Live Call Ingress](#-telephony--live-call-ingress)
- [Indian Accent & Multilingual Dataset](#-indian-accent--multilingual-dataset)
- [SOC Console Views](#-soc-console-views)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start Guide](#-quick-start-guide)
- [Live Telephony Integration Setup](#-live-telephony-integration-setup)
- [API Reference](#-api-reference)
- [Automated Testing](#-automated-testing)
- [Zero-Trust Scoring Engine Formula](#-zero-trust-scoring-engine-formula)
- [License](#-license)

---

## 🎯 Overview

As generative voice synthesis (TTS, voice conversion, diffusion vocoders) reaches photorealistic quality, threat actors increasingly weaponize deepfakes for:
- **Executive Impersonation (CEO Fraud)**: Fabricated C-suite voices authorizing emergency wire transfers.
- **Credential & OTP Harvesting**: Automated synthetic voices requesting banking authentication codes.
- **Telephony Channel Bypass**: Bypassing traditional contact center voice biometric security using replay and ITU-T codec injection.

**VoxCipher** addresses this threat through an **action-aware, multi-layered zero-trust architecture**. Rather than relying on a single fallible ML model, VoxCipher cross-examines 8 independent acoustic, physical, temporal, and linguistic vectors before calculating a dynamic **Voice Trust Score (0–100)**.

---

## 🏗️ Architecture & Zero-Trust Pipeline

```
                                  VOXCIPHER ZERO-TRUST DEFENSE PIPELINE
                                  
  [ Inbound Audio Stream ] ──► (Microphone / PSTN / Twilio / Asterisk / WAV Upload)
             │
             ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. Feature Extraction: 13 MFCCs, Mel Spectrogram, Spectral Centroid,  │
  │    Spectral Contrast, Zero-Crossing Rate, RMS Energy, F0 Pitch Jitter  │
  └────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                      PARALLEL DETECTION ENGINES                        │
  ├───────────────────────┬────────────────────────┬───────────────────────┤
  │ Layer 1: Deepfake     │ Layer 2: Channel & DSP │ Layer 3: Speaker      │
  │ Vocoder artifacts,    │ Codec clipping (GSM,   │ Consistency           │
  │ spectral rolloff,     │ G.711, AMR), replay,   │ 3s sliding window     │
  │ prosodic jitter       │ acoustic injection     │ cosine distance       │
  ├───────────────────────┴────────────────────────┴───────────────────────┤
  │ Layer 4: Multilingual Conversation Risk Engine (English, Hindi, Hinglish)│
  │ Intent classification: OTP harvesting, wire fraud, urgency, secrecy   │
  └────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ Layer 5: Voice Trust Engine (Weighted Multi-Signal Composite Metric)   │
  │ Yields Voice Trust Score (0–100) & Evaluates Action Sensitivity        │
  └────────────────────────────────────────────────────────────────────────┘
             │
             ├──────────────────────────┬──────────────────────────┐
             ▼                          ▼                          ▼
     [ Trust Score ≥ 80 ]       [ 60 ≤ Score < 80 ]        [ Trust Score < 60 ]
         🟢 SAFE                     🟡 CHALLENGE                 🔴 CRITICAL
     Action Authorized         Layer 6: Dynamic Phonetic    Layer 7: Action Intercept
                               Voice Liveness Prompt        Freeze Wire Transfer /
                               Latency & Prosody Verified   Terminate Call Line
```

---

## 🛡️ Multi-Layer Defense Matrix

| Layer | Engine | Primary Attack Vector Detected | Methodology |
|---|---|---|---|
| **1** | `deepfake_detector.py` | AI Voice Clones (ElevenLabs, Tortoise, VITS) | High-frequency vocoder anomalies, spectral centroid flatness, micro-pitch prosody variance |
| **2** | `channel_detector.py` | Physical Replay, Phone Codecs (GSM/G.711/AMR), Injection | Bandpass cutoff, ITU-T codec quantization, speaker replay acoustic resonance |
| **3** | `speaker_consistency.py` | Mid-Call Voice Swapping & Spliced Adversarial Audio | Temporal sliding window ($3\text{s}$) MFCC cosine distance tracking |
| **4** | `conversation_risk.py` | Social Engineering & Extortion | Multi-pattern regex & NLP classifier for OTP theft, urgency, secrecy, and wire transfers (English, Hindi, Hinglish) |
| **5** | `trust_engine.py` | Overall Identity Assurance | Multi-factor weighted composite scoring calibrated into a 0–100 Zero-Trust Metric |
| **6** | `challenge_service.py` | Static Deepfake Playback / Asynchronous Voice Bots | Dynamic, time-expiring phonetic challenges (e.g., *"Blue orbit dances over velvet mountains"*) with millisecond latency verification |
| **7** | `ActionDefenseModal.tsx` | High-Value Financial Exfiltration | Action-aware automatic freeze on transactions $\ge \$10,000$ or credential authorization |
| **8** | `lab_service.py` | Algorithm Degradation in Low-Bandwidth Networks | DSP stress-testing across 9 telecom channel degradations with EER, FAR, FRR metrics |

---

## 🚀 Key Capabilities

- **Live Call Interception Console**: Real-time sniffer displaying live waveform, streaming transcription, instantaneous trust gauge, and dynamic challenge prompts.
- **Continuous Telephony WebSocket**: Ingests live 8kHz $\mu$-law streams from Twilio Media Streams, Asterisk PBX, or softphones with bidirectional telemetry.
- **Indian Accent & Multilingual NLP Engine**: Native support for Indian English, Hindi, and Hinglish dialogue, integrated with Kaggle's `polly42rose/indian-accent-dataset`.
- **Adaptive Voice Challenge Center**: Generates randomized phonetic phrases with a client-side stopwatch and acoustic verification engine.
- **Interactive SOC Attack Laboratory**: Benchmarks detection resilience under simulated GSM, G.711, AMR-NB, acoustic noise, reverb, and re-compression codecs.
- **Executive Audit Dossiers & PDF Reports**: Generate tamper-evident forensic threat incident reports with one-click JSON and PDF exports.
- **Interactive Zero-Trust Sandbox**: Adjust weight coefficients ($w_{\text{deepfake}}, w_{\text{consistency}}, w_{\text{channel}}, w_{\text{behavior}}$) in real-time.
- **Resilient Dual-Network Transport**: Custom client-side `smartFetch` layer with automatic proxy and direct fallback to avoid CORS/IPv6 binding issues.

---

## 📞 Telephony & Live Call Ingress

VoxCipher supports **4 enterprise live-call ingress methods**:

### 1. Twilio Voice Media Streams (PSTN & Mobile Phone Calls)
VoxCipher includes a native TwiML webhook (`/api/telephony/twilio-webhook`). Point any Twilio phone number to this webhook to fork inbound audio directly to VoxCipher's WebSocket:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Connecting to VoxCipher Zero-Trust Voice Defense.</Say>
    <Connect>
        <Stream url="wss://YOUR_DOMAIN/api/ws/call-stream" />
    </Connect>
</Response>
```

### 2. Asterisk & FreePBX PBX (Call Center VoIP)
Mirror live RTP channels without introducing call delay using Asterisk's `res_audiosocket`:
```ini
[inbound-enterprise]
exten => _X.,1,Answer()
same => n,Set(CALL_UUID=${UNIQUEID})
same => n,AudioSocket(${CALL_UUID},voxcipher-host:8000/api/ws/call-stream)
same => n,Dial(PJSIP/${EXTEN})
```

### 3. Desktop Call Sniffing (Zoom, MS Teams, WhatsApp Desktop)
Monitor calls directly on a security analyst workstation:
1. Install [VB-Audio Virtual Cable](https://vb-audio.com/Cable/) or enable Windows **Stereo Mix**.
2. Set Zoom/Teams/WhatsApp Speaker output to **CABLE Input**.
3. Select **CABLE Output** as the input microphone on VoxCipher's Live Call Console.

### 4. In-Browser WebRTC Softphone
Taps incoming peer audio streams via the Web Audio API (`AudioContext`) and dispatches 2-second acoustic slices to `/api/ws/call-stream`.

---

## 🇮🇳 Indian Accent & Multilingual Dataset

VoxCipher natively handles Indian English and regional accents, addressing one of the most critical vulnerability vectors in global financial fraud:
- **Kaggle Dataset Integration**: Seamlessly pulls from [`polly42rose/indian-accent-dataset`](https://www.kaggle.com/datasets/polly42rose/indian-accent-dataset) using `kagglehub`.
- **Pre-Packaged Audio Presets**:
  - `sample_indian_clean_voice.wav`: Authentic Indian English corporate speaker.
  - `sample_hindi_urgent_fraud.wav`: Urgent financial fraud in Hindi (*"तुरंत ₹50,000 भेजें..."*).
  - `sample_indian_deepfake_synthetic.wav`: Vocoder-synthesized clone of Indian accent speech.
- **Multilingual Keywords**: Detects OTP solicitation (*"ओटीपी"*, *"पासवर्ड"*), urgency (*"तुरंत"*, *"जल्दी"*), and secrecy (*"किसी को मत बताना"*).

---

## 🖥️ SOC Console Views

| Page | URL Route | Description |
|---|---|---|
| **Dashboard** | `/` | Real-time SOC posture, threat activity feed, and instant attack simulation trigger |
| **Live Call** | `/live-call` | Ingress console with dual modes: Browser Sniffer & Telephony Gateway (WebSocket / Twilio / Asterisk) |
| **Voice Analysis** | `/voice-analysis` | Full-file forensic workstation with 9+ acoustic dimensions, spectrograms, and timeline |
| **Challenge Center** | `/challenge-center` | Dynamic phonetic phrase generator, audio challenge recorder, and latency verification |
| **Trust Engine** | `/trust-engine` | Interactive weight sandbox, SVG circular gauge, and 4-tier risk classification matrix |
| **Threat Intelligence** | `/threats` | SQLite-persisted threat database with severity filters, caller search, and incident drill-down |
| **SOC Analytics** | `/analytics` | Recharts dashboard with attack vector distribution, risk trends, and clearance metrics |
| **Attack Laboratory** | `/attack-lab` | DSP codec benchmark suite (GSM, G.711, AMR, noise, echo) with EER, FAR, FRR |
| **Incident Reports** | `/reports` | Comprehensive audit dossiers with PDF generation and JSON export |
| **Settings** | `/settings` | Risk threshold sliders, SIEM webhook integration, and plug-and-play neural connectors |

---

## 💻 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11) with ASGI Uvicorn
- **Audio Processing**: Librosa, SoundFile, NumPy, SciPy
- **Telephony & Real-Time**: WebSockets, AudioOp / PCMU mu-law decoding, Wave, TwiML
- **Database**: SQLite with SQLAlchemy ORM
- **Validation & Testing**: Pydantic v2, Pytest, HTTPX

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite 5, PostCSS, Autoprefixer
- **Styling**: Tailwind CSS (Dark SOC Theme)
- **Visualizations**: Recharts, Custom Animated SVG Trust Gauge, HTML5 Canvas Waveform
- **Icons**: Lucide React

---

## 📁 Project Structure

```
voxsentinel/
├── backend/
│   ├── app/
│   │   ├── database/
│   │   │   ├── connection.py        # SQLAlchemy engine & session factory
│   │   │   └── models.py            # ThreatRecord, ChallengeSession, LabExperiment
│   │   ├── detectors/
│   │   │   ├── audio_features.py    # 9-dimension acoustic feature extractor
│   │   │   ├── deepfake_detector.py # Vocoder synthesis & micro-prosody analysis
│   │   │   ├── channel_detector.py  # Codec compression (GSM, G.711, AMR) & replay
│   │   │   ├── speaker_consistency.py # 3-second temporal sliding window cosine distance
│   │   │   ├── conversation_risk.py # Multilingual NLP threat keyword classifier
│   │   │   └── trust_engine.py      # Weighted composite Zero-Trust scoring engine
│   │   ├── routes/
│   │   │   ├── analyze.py           # /api/analyze, /api/ws/call-stream, /api/telephony/*
│   │   │   ├── challenge.py         # Dynamic phrase generator & liveness verification
│   │   │   ├── threats.py           # Incident database queries & audit trail
│   │   │   ├── analytics.py         # SOC telemetry aggregation
│   │   │   ├── lab.py               # DSP codec stress tests & benchmarks
│   │   │   ├── reports.py           # Incident dossier export
│   │   │   └── health.py            # System health & subsystem diagnostics
│   │   ├── services/
│   │   │   ├── challenge_service.py # Phonetic phrase banks & latency evaluation
│   │   │   ├── simulation_service.py# End-to-end CEO fraud progression simulator
│   │   │   ├── lab_service.py       # DSP distortions (AMR, GSM, G.711, Reverb)
│   │   │   ├── threat_service.py    # Threat persistence & demo seeder
│   │   │   └── kaggle_dataset_service.py # Indian Accent dataset loader
│   │   └── main.py                  # FastAPI app factory, CORS, static SPA mount
│   ├── data/
│   │   ├── samples/                 # Pre-packaged Indian & English audio test files
│   │   └── voxsentinel.db           # SQLite database
│   ├── tests/
│   │   └── test_detectors.py        # 11 unit & integration pytest cases
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # TrustGauge, AudioRecorder, ConsistencyTimeline, etc.
│   │   ├── pages/                   # 10 full SOC dashboard pages
│   │   ├── services/                # API client with smartFetch dual-network resilience
│   │   ├── types/                   # TypeScript interfaces
│   │   ├── App.tsx                  # App root & route registration
│   │   └── main.tsx                 # React entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── README.md                        # Primary GitHub documentation
└── GITHUB_README.md                 # Standalone GitHub showcase README
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python**: 3.10 or 3.11
- **Node.js**: 18.0 or 20.0+ (and npm)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/VoxCipher.git
cd VoxCipher
```

---

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (serves API on :8000 and the built SPA)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000`.  
Swagger interactive API docs: `http://localhost:8000/docs`.

---

### Step 3: Frontend Setup
In a separate terminal:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at **`http://localhost:5173`** (or `http://localhost:8000`).

---

### Step 4: Build for Production
To package the frontend into the backend for single-port deployment:
```bash
cd frontend
npm run build
```
FastAPI will now serve both the REST API and the production SPA from `http://localhost:8000/`.

---

## 🧪 Automated Testing

VoxCipher includes a suite of automated unit and integration tests verifying all 7 security layers:

```bash
cd backend
python -m pytest tests/ -v
```

**Expected Output:**
```
tests/test_detectors.py::test_feature_extraction_synthetic PASSED       [  9%]
tests/test_detectors.py::test_deepfake_detector_clean PASSED            [ 18%]
tests/test_detectors.py::test_deepfake_detector_synthetic PASSED        [ 27%]
tests/test_detectors.py::test_channel_detector PASSED                   [ 36%]
tests/test_detectors.py::test_speaker_consistency PASSED                [ 45%]
tests/test_detectors.py::test_conversation_risk_safe PASSED             [ 54%]
tests/test_detectors.py::test_conversation_risk_threat PASSED           [ 63%]
tests/test_detectors.py::test_trust_engine_scoring PASSED               [ 72%]
tests/test_detectors.py::test_challenge_flow PASSED                     [ 81%]
tests/test_detectors.py::test_api_analyze_endpoint PASSED               [ 90%]
tests/test_detectors.py::test_api_health PASSED                         [100%]

======================== 11 passed in 3.32s =========================
```

---

## 📐 Zero-Trust Scoring Engine Formula

The **Composite Voice Risk** ($R_{\text{voice}}$) is calculated using normalized, empirically weighted risk indicators:

$$R_{\text{voice}} = w_{\text{df}} \cdot S_{\text{deepfake}} + w_{\text{ch}} \cdot S_{\text{channel}} + w_{\text{spk}} \cdot (100 - S_{\text{consistency}}) + w_{\text{beh}} \cdot S_{\text{behavior}}$$

Where:
- $w_{\text{df}} = 0.35$ (Deepfake Vocoder / Micro-Prosody Weight)
- $w_{\text{ch}} = 0.20$ (Channel Distortion / Codec Weight)
- $w_{\text{spk}} = 0.25$ (Speaker Consistency Temporal Weight)
- $w_{\text{beh}} = 0.20$ (Behavioral Social Engineering Weight)

The final **Voice Trust Score** ($T_{\text{voice}}$) incorporates contextual action penalties:

$$T_{\text{voice}} = \max\Big(0, \min\big(100, 100 - R_{\text{voice}} - P_{\text{action}} + B_{\text{challenge}}\big)\Big)$$

Where:
- $P_{\text{action}}$: Action penalty applied to high-risk operations (e.g. $+15$ for wire transfers $>\$10,000$).
- $B_{\text{challenge}}$: Bonus applied when an adaptive challenge is passed ($+25$), or penalty if failed ($-40$).

### Decision Policy
- **$T_{\text{voice}} \ge 80$**: 🟢 `TRUSTED` — Authorize action.
- **$60 \le T_{\text{voice}} < 80$**: 🟡 `SUSPICIOUS` — Flag anomaly for review.
- **$40 \le T_{\text{voice}} < 60$**: 🟠 `VERIFICATION_REQUIRED` — Trigger Dynamic Voice Challenge.
- **$T_{\text{voice}} < 40$**: 🔴 `CRITICAL` — Intercept call, auto-freeze transaction, alert SOC operator.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with zero-trust principles for a post-synthetic voice world.</strong><br />
  <sub>VoxCipher Defense Systems • Cybersecurity SOC Engineering</sub>
</p>
