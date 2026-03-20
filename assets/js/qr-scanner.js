// QR Code Scanner Script

let html5QrCode = null;
let isScanning = false;
let lastResult = '';
let html5QrCodeUpload = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Check for hash navigation
  const hash = window.location.hash.substring(1);
  if (hash === 'camera' || hash === 'upload' || hash === 'history') {
    switchTab(hash);
  } else {
    switchTab('upload'); // Default to upload tab
  }
  
  // Load history if on history tab
  if (hash === 'history') {
    scanHistory.renderHistory('history-list');
  }
    // Create ONE upload decoder instance bound to #upload-reader
  html5QrCodeUpload = new Html5Qrcode("upload-reader");
});

// Switch between tabs
function switchTab(tab) {
  // Hide all tabs
  document.querySelectorAll('.scanner-tab').forEach(el => {
    el.classList.add('hidden');
  });
  
  // Reset button styles
  document.querySelectorAll('[id^="tab-"]').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  });
  
  // Show selected tab
  const tabElement = document.getElementById(`${tab}-scanner`);
  if (tabElement) {
    tabElement.classList.remove('hidden');
  }
  
  // Highlight active button
  const activeBtn = document.getElementById(`tab-${tab}`);
  if (activeBtn) {
    activeBtn.classList.remove('btn-secondary');
    activeBtn.classList.add('btn-primary');
  }
  
  // Stop camera if switching away from camera tab
  if (tab !== 'camera' && isScanning) {
    stopCamera();
  }
  
  // Load history if switching to history tab
  if (tab === 'history') {
    scanHistory.renderHistory('history-list');
  }
  
  // Update URL hash
  window.location.hash = tab;
}

// ============================================
// Camera Scanner
// ============================================

function startCamera() {
  if (isScanning) return;
  
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };
  
  html5QrCode = new Html5Qrcode("reader");
  
  html5QrCode.start(
    { facingMode: "environment" },
    config,
    onScanSuccess,
    onScanFailure
  ).then(() => {
    isScanning = true;
    document.getElementById('start-camera').classList.add('hidden');
    document.getElementById('stop-camera').classList.remove('hidden');
    showAlert('Camera started successfully', 'success');
  }).catch(err => {
    console.error('Camera start error:', err);
    showAlert('Failed to start camera. Please check permissions.', 'error');
  });
}

function stopCamera() {
  if (!isScanning || !html5QrCode) return;
  
  html5QrCode.stop().then(() => {
    isScanning = false;
    document.getElementById('start-camera').classList.remove('hidden');
    document.getElementById('stop-camera').classList.add('hidden');
    showAlert('Camera stopped', 'success');
  }).catch(err => {
    console.error('Camera stop error:', err);
  });
}

function onScanSuccess(decodedText, decodedResult) {
  // Avoid duplicate scans
  if (decodedText === lastResult) return;
  
  lastResult = decodedText;
  
  // Display result
  const resultDiv = document.getElementById('camera-result');
  const resultText = document.getElementById('camera-result-text');
  const openBtn = document.getElementById('open-url-btn');
  
  resultDiv.classList.remove('hidden');
  resultText.textContent = decodedText;
  
  // Show open button if it's a URL
  if (isValidURL(decodedText)) {
    openBtn.style.display = 'inline-block';
    openBtn.setAttribute('data-url', decodedText);
    checkSuspiciousURL(decodedText);
  } else {
    openBtn.style.display = 'none';
  }
  
  // Add to history
  scanHistory.addScan(decodedText, 'camera');
  
  // Play success sound (optional)
  playSuccessSound();
  
  // Show success message
  showAlert('QR code scanned successfully!', 'success');
}

function onScanFailure(error) {
  // Silently fail - scanner continuously tries
}

function openResultURL() {
  const btn = document.getElementById('open-url-btn');
  const url = btn.getAttribute('data-url');
  
  if (url && isValidURL(url)) {
    if (confirm(`Open this URL?\n\n${url}`)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

// ============================================
// Image Upload Scanner
// ============================================

// ============================================
// Image Upload Scanner (FIXED)
// ============================================

function handleFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type || !file.type.startsWith("image/")) {
    showAlert("Please upload a valid image file", "error");
    return;
  }

  // HEIC often fails in browsers/html5-qrcode
  if (file.type === "image/heic" || file.type === "image/heif") {
    showAlert("HEIC/HEIF images are not supported. Please convert to PNG/JPG.", "error");
    return;
  }

  // Show preview (this is fine)
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById("uploaded-image");
    img.src = e.target.result;
    document.getElementById("upload-preview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);

  // Decode from the ORIGINAL File object (not the DataURL)
  decodeQRFromFile(file);
}

function decodeQRFromFile(file) {
  if (!html5QrCodeUpload) {
    showAlert("Upload scanner not initialized. Please refresh the page.", "error");
    return;
  }

  // Hide old result while decoding
  document.getElementById("upload-result").classList.add("hidden");
  document.getElementById("open-upload-url-btn").style.display = "none";

  // IMPORTANT: pass File, and set showImage=false (prevents render/layout issues)
  html5QrCodeUpload.scanFile(file, false)
    .then(decodedText => {
      const resultDiv = document.getElementById("upload-result");
      const resultText = document.getElementById("upload-result-text");
      const openBtn = document.getElementById("open-upload-url-btn");

      resultDiv.classList.remove("hidden");

      // If it's a WiFi QR, format it nicely for the user
      if (decodedText.startsWith("WIFI:")) {
        resultText.textContent = formatWifi(decodedText) + "\n\nRaw:\n" + decodedText;
        openBtn.style.display = "none";
      } else {
        resultText.textContent = decodedText;

        // Show open button if it's a URL
        if (isValidURL(decodedText)) {
          openBtn.style.display = "inline-block";
          openBtn.setAttribute("data-url", decodedText);
          checkSuspiciousURL(decodedText);
        } else {
          openBtn.style.display = "none";
        }
      }

      scanHistory.addScan(decodedText, "upload");
      showAlert("QR code decoded successfully!", "success");
    })
    .catch(err => {
      console.error("Decode error:", err);

      // Show error in result area so user knows it tried
      const resultDiv = document.getElementById("upload-result");
      const resultText = document.getElementById("upload-result-text");
      resultDiv.classList.remove("hidden");
      resultText.textContent =
        "No QR code found in this image.\n\nTips: use a sharper image, crop closer to the QR, avoid glare.\n\nError: " +
        (err?.message || String(err));

      showAlert("No QR code found in image. Please try another image.", "error");
    });
}

// Pretty display for WiFi QR payloads
function formatWifi(payload) {
  // Example: WIFI:T:WPA;S:MySSID;P:MyPass;H:false;;
  const out = { T: "", S: "", P: "", H: "" };

  // Remove WIFI:
  const body = payload.slice(5);
  body.split(";").forEach(part => {
    if (part.startsWith("T:")) out.T = part.slice(2);
    if (part.startsWith("S:")) out.S = part.slice(2);
    if (part.startsWith("P:")) out.P = part.slice(2);
    if (part.startsWith("H:")) out.H = part.slice(2);
  });

  return [
    "WiFi QR Code Detected",
    `SSID: ${out.S || "(unknown)"}`,
    `Security: ${out.T || "(unknown)"}`,
    `Password: ${out.P || "(none)"}`,
    `Hidden: ${String(out.H).toLowerCase() === "true" ? "Yes" : "No"}`
  ].join("\n");
}

function decodeQRFromImage(imageData) {
  const html5QrCodeScanner = new Html5Qrcode("upload-result");
  
  html5QrCodeScanner.scanFile(imageData, true)
    .then(decodedText => {
      // Display result
      const resultDiv = document.getElementById('upload-result');
      const resultText = document.getElementById('upload-result-text');
      const openBtn = document.getElementById('open-upload-url-btn');
      
      resultDiv.classList.remove('hidden');
      resultText.textContent = decodedText;
      
      // Show open button if it's a URL
      if (isValidURL(decodedText)) {
        openBtn.style.display = 'inline-block';
        openBtn.setAttribute('data-url', decodedText);
        checkSuspiciousURL(decodedText);
      } else {
        openBtn.style.display = 'none';
      }
      
      // Add to history
      scanHistory.addScan(decodedText, 'upload');
      
      showAlert('QR code decoded successfully!', 'success');
    })
    .catch(err => {
      console.error('Decode error:', err);
      showAlert('No QR code found in image. Please try another image.', 'error');
      
      document.getElementById('upload-result').classList.add('hidden');
    });
}

function openUploadURL() {
  const btn = document.getElementById('open-upload-url-btn');
  const url = btn.getAttribute('data-url');
  
  if (url && isValidURL(url)) {
    if (confirm(`Open this URL?\n\n${url}`)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

// ============================================
// Helper Functions
// ============================================

function playSuccessSound() {
  // Simple beep sound using Web Audio API
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    // Sound playback not critical
  }
}

// Export functions for global use
window.switchTab = switchTab;
window.startCamera = startCamera;
window.stopCamera = stopCamera;
window.handleFileUpload = handleFileUpload;
window.openResultURL = openResultURL;
window.openUploadURL = openUploadURL;