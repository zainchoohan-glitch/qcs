// QR Code Generator Script

let qrcode = null;
let currentQRData = '';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  const qrTypeSelect = document.getElementById('qr-type');
  const form = document.getElementById('qr-generator-form');
  
  // QR type change handler
  if (qrTypeSelect) {
    qrTypeSelect.addEventListener('change', handleQRTypeChange);
  }
  
  // Form submit handler
  if (form) {
    form.addEventListener('submit', handleGenerateQR);
  }
  
  // Initialize with URL fields visible
  handleQRTypeChange();
});

// Handle QR type selection change
function handleQRTypeChange() {
  const qrType = document.getElementById('qr-type').value;
  
  // Hide all field groups
  document.querySelectorAll('.qr-type-fields').forEach(field => {
    field.classList.add('hidden');
    field.querySelectorAll('input, textarea').forEach(input => {
      input.removeAttribute('required');
    });
  });
  
  // Show selected field group
  const selectedFields = document.getElementById(`${qrType}-fields`);
  if (selectedFields) {
    selectedFields.classList.remove('hidden');
    selectedFields.querySelectorAll('input[type="url"], input[type="email"], input[type="tel"], textarea').forEach(input => {
      if (!input.id.includes('optional') && !input.id.includes('subject') && !input.id.includes('body') && !input.id.includes('message')) {
        input.setAttribute('required', 'required');
      }
    });
  }
}

// Handle QR code generation
function handleGenerateQR(event) {
  event.preventDefault();
  
  const qrType = document.getElementById('qr-type').value;
  const size = parseInt(document.getElementById('qr-size').value);
  
  let qrData = '';
  
  // Build QR data based on type
  switch(qrType) {
    case 'url':
      const url = document.getElementById('url-input').value.trim();
      if (!isValidURL(url)) {
        showAlert('Please enter a valid URL starting with http:// or https://', 'error');
        return;
      }
      qrData = url;
      break;
      
    case 'text':
      qrData = document.getElementById('text-input').value.trim();
      if (!qrData) {
        showAlert('Please enter some text', 'error');
        return;
      }
      break;
      
    case 'email':
      const email = document.getElementById('email-input').value.trim();
      if (!isValidEmail(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
      }
      const subject = document.getElementById('email-subject').value.trim();
      const body = document.getElementById('email-body').value.trim();
      
      qrData = `mailto:${email}`;
      const params = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      if (params.length > 0) {
        qrData += '?' + params.join('&');
      }
      break;
      
    case 'phone':
      const phone = document.getElementById('phone-input').value.trim();
      if (!isValidPhone(phone)) {
        showAlert('Please enter a valid phone number', 'error');
        return;
      }
      qrData = `tel:${phone}`;
      break;
      
    case 'sms':
      const smsNumber = document.getElementById('sms-number').value.trim();
      if (!isValidPhone(smsNumber)) {
        showAlert('Please enter a valid phone number', 'error');
        return;
      }
      const smsMessage = document.getElementById('sms-message').value.trim();
      qrData = `sms:${smsNumber}`;
      if (smsMessage) {
        qrData += `?body=${encodeURIComponent(smsMessage)}`;
      }
      break;
      
    default:
      showAlert('Invalid QR type selected', 'error');
      return;
  }
  
  // Generate QR code
  generateQRCode(qrData, size);
}

// Generate QR code using QRCode.js
function generateQRCode(data, size) {
  // Clear previous QR code
  const container = document.getElementById('qrcode-container');
  container.innerHTML = '';
  
  // Create new QR code
  qrcode = new QRCode(container, {
    text: data,
    width: size,
    height: size,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  
  // Store current QR data
  currentQRData = data;
  
  // Show output section
  const output = document.getElementById('qr-output');
  output.classList.remove('hidden');
  
  // Display data
  const dataDisplay = document.getElementById('qr-data-display');
  dataDisplay.innerHTML = `<strong>Content:</strong> ${escapeHtml(data)}`;
  
  // Scroll to result
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  showAlert('QR code generated successfully!', 'success');
}

// Download QR code as PNG
function downloadQRCodeImage() {
  const canvas = document.querySelector('#qrcode-container canvas');
  if (!canvas) {
    showAlert('No QR code to download', 'error');
    return;
  }
  
  // Convert canvas to blob and download
  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    
    showAlert('QR code downloaded successfully!', 'success');
  });
}

// Copy QR code to clipboard
function copyQRToClipboard() {
  const canvas = document.querySelector('#qrcode-container canvas');
  if (!canvas) {
    showAlert('No QR code to copy', 'error');
    return;
  }
  
  canvas.toBlob(function(blob) {
    const item = new ClipboardItem({ 'image/png': blob });
    navigator.clipboard.write([item]).then(function() {
      showAlert('QR code copied to clipboard!', 'success');
    }).catch(function(err) {
      // Fallback: copy the data as text
      copyToClipboard(currentQRData);
    });
  });
}

// Clear QR code
function clearQRCode() {
  const container = document.getElementById('qrcode-container');
  container.innerHTML = '';
  
  const output = document.getElementById('qr-output');
  output.classList.add('hidden');
  
  currentQRData = '';
  qrcode = null;
  
  showAlert('QR code cleared', 'success');
}

// Escape HTML for safe display
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