// WiFi QR Code Generator Script

let wifiQRCode = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('wifi-qr-form');
  const encryptionSelect = document.getElementById('wifi-encryption');
  
  if (form) {
    form.addEventListener('submit', handleGenerateWiFiQR);
  }
  
  if (encryptionSelect) {
    encryptionSelect.addEventListener('change', handleEncryptionChange);
  }
});

// Handle encryption type change
function handleEncryptionChange() {
  const encryption = document.getElementById('wifi-encryption').value;
  const passwordGroup = document.getElementById('password-group');
  const passwordInput = document.getElementById('wifi-password');
  
  if (encryption === 'nopass') {
    passwordGroup.style.display = 'none';
    passwordInput.removeAttribute('required');
    passwordInput.value = '';
  } else {
    passwordGroup.style.display = 'block';
    passwordInput.setAttribute('required', 'required');
  }
}

// Toggle password visibility
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('wifi-password');
  const toggleIcon = document.getElementById('password-toggle-icon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.textContent = '🙈';
  } else {
    passwordInput.type = 'password';
    toggleIcon.textContent = '👁️';
  }
}

// Handle WiFi QR generation
function handleGenerateWiFiQR(event) {
  event.preventDefault();
  
  const ssid = document.getElementById('wifi-ssid').value.trim();
  const encryption = document.getElementById('wifi-encryption').value;
  const password = document.getElementById('wifi-password').value;
  const hidden = document.getElementById('wifi-hidden').checked;
  const size = parseInt(document.getElementById('wifi-qr-size').value);
  
  // Validate SSID
  if (!ssid) {
    showAlert('Please enter a network name (SSID)', 'error');
    return;
  }
  
  // Validate password for secured networks
  if (encryption !== 'nopass' && !password) {
    showAlert('Please enter a WiFi password', 'error');
    return;
  }
  
  // Build WiFi QR string
  // Format: WIFI:T:WPA;S:mynetwork;P:mypassword;H:true;;
  let wifiString = 'WIFI:';
  wifiString += `T:${encryption};`;
  wifiString += `S:${escapeSpecialChars(ssid)};`;
  
  if (encryption !== 'nopass') {
    wifiString += `P:${escapeSpecialChars(password)};`;
  }
  
  if (hidden) {
    wifiString += 'H:true;';
  }
  
  wifiString += ';';
  
  // Generate QR code
  generateWiFiQRCode(wifiString, size, ssid, encryption, hidden);
}

// Escape special characters for WiFi QR format
function escapeSpecialChars(str) {
  return str.replace(/([\\;,":.])/g, '\\$1');
}

// Generate WiFi QR code
function generateWiFiQRCode(wifiString, size, ssid, encryption, hidden) {
  // Clear previous QR code
  const container = document.getElementById('wifi-qrcode-container');
  container.innerHTML = '';
  
  // Create new QR code
  wifiQRCode = new QRCode(container, {
    text: wifiString,
    width: size,
    height: size,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  
  // Show output section
  const output = document.getElementById('wifi-qr-output');
  output.classList.remove('hidden');
  
  // Display WiFi information
  const detailsDiv = document.getElementById('wifi-details');
  const encryptionLabel = encryption === 'WPA' ? 'WPA/WPA2' : encryption === 'WEP' ? 'WEP' : 'Open (No Password)';
  
  detailsDiv.innerHTML = `
    <p style="margin: 0.5rem 0;"><strong>Network Name:</strong> ${escapeHtml(ssid)}</p>
    <p style="margin: 0.5rem 0;"><strong>Security:</strong> ${encryptionLabel}</p>
    <p style="margin: 0.5rem 0;"><strong>Hidden Network:</strong> ${hidden ? 'Yes' : 'No'}</p>
  `;
  
  // Scroll to result
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  showAlert('WiFi QR code generated successfully!', 'success');
}

// Download WiFi QR code
function downloadWiFiQR() {
  const canvas = document.querySelector('#wifi-qrcode-container canvas');
  if (!canvas) {
    showAlert('No QR code to download', 'error');
    return;
  }
  
  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const ssid = document.getElementById('wifi-ssid').value.trim();
    link.download = `wifi-${ssid.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-qr.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    
    showAlert('WiFi QR code downloaded successfully!', 'success');
  });
}

// Print WiFi QR code
function printWiFiQR() {
  const canvas = document.querySelector('#wifi-qrcode-container canvas');
  if (!canvas) {
    showAlert('No QR code to print', 'error');
    return;
  }
  
  const ssid = document.getElementById('wifi-ssid').value.trim();
  const encryption = document.getElementById('wifi-encryption').value;
  const encryptionLabel = encryption === 'WPA' ? 'WPA/WPA2' : encryption === 'WEP' ? 'WEP' : 'Open';
  
  // Create print window
  const printWindow = window.open('', '_blank');
  const qrDataURL = canvas.toDataURL('image/png');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WiFi QR Code - ${escapeHtml(ssid)}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .qr-print-container {
          text-align: center;
          border: 2px solid #000;
          padding: 30px;
          border-radius: 10px;
          max-width: 600px;
        }
        h1 {
          margin-bottom: 10px;
          font-size: 2rem;
        }
        .network-name {
          font-size: 1.5rem;
          font-weight: bold;
          color: #c2f711;
          margin: 10px 0;
        }
        .qr-image {
          margin: 20px 0;
        }
        .instructions {
          margin-top: 20px;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          font-size: 0.9rem;
          color: #666;
        }
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="qr-print-container">
        <h1>WiFi Network QR Code</h1>
        <div class="network-name">${escapeHtml(ssid)}</div>
        <div class="qr-image">
          <img src="${qrDataURL}" alt="WiFi QR Code" style="max-width: 100%; height: auto;">
        </div>
        <div class="instructions">
          <p><strong>How to Connect:</strong></p>
          <p>1. Open your phone's camera app</p>
          <p>2. Point it at this QR code</p>
          <p>3. Tap the notification to join the network</p>
          <p style="margin-top: 15px;"><strong>Security:</strong> ${encryptionLabel}</p>
        </div>
        <div class="footer">
          <p>Generated with ScanQR Pro</p>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  showAlert('Print dialog opened', 'success');
}

// Clear WiFi QR code
function clearWiFiQR() {
  const container = document.getElementById('wifi-qrcode-container');
  container.innerHTML = '';
  
  const output = document.getElementById('wifi-qr-output');
  output.classList.add('hidden');
  
  wifiQRCode = null;
  
  showAlert('QR code cleared', 'success');
}

// Escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Export functions for global use
window.togglePasswordVisibility = togglePasswordVisibility;
window.downloadWiFiQR = downloadWiFiQR;
window.printWiFiQR = printWiFiQR;
window.clearWiFiQR = clearWiFiQR;