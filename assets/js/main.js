// ============================================
// ScanQR Pro - Main JavaScript
// ============================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initMobileMenu();
  setActiveNavLink();
});

// ============================================
// Theme Management (Dark/Light Mode)
// ============================================
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.className = savedTheme + '-mode';
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    updateThemeIcon();
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.className = newTheme + '-mode';
  localStorage.setItem('theme', newTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.querySelector('.theme-icon');
  if (!icon) return;
  
  const isDark = document.body.classList.contains('dark-mode');
  icon.textContent = isDark ? '☀️' : '🌙';
}

// ============================================
// Mobile Menu
// ============================================
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
      }
    });
    
    // Close menu on link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }
}

// ============================================
// Active Navigation Link
// ============================================
function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-menu a');
  
  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;
    if (currentPath === linkPath || (currentPath === '/' && linkPath.includes('index.html'))) {
      link.classList.add('active');
    }
  });
}

// ============================================
// Utility Functions
// ============================================

// Show Alert Message
function showAlert(message, type = 'success') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  const container = document.querySelector('.container');
  if (container) {
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => {
      alert.remove();
    }, 5000);
  }
}

// Copy to Clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showAlert('Copied to clipboard!', 'success');
    }).catch(err => {
      showAlert('Failed to copy', 'error');
    });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      showAlert('Copied to clipboard!', 'success');
    } catch (err) {
      showAlert('Failed to copy', 'error');
    }
    
    document.body.removeChild(textArea);
  }
}

// Download QR Code
function downloadQRCode(format = 'png') {
  const canvas = document.querySelector('#qrcode-container canvas');
  if (!canvas) {
    showAlert('No QR code to download', 'error');
    return;
  }
  
  const link = document.createElement('a');
  link.download = `qrcode-${Date.now()}.${format}`;
  link.href = canvas.toDataURL(`image/${format}`);
  link.click();
  
  showAlert('QR code downloaded!', 'success');
}

// Format Date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return date.toLocaleDateString('en-US', options);
}

// Validate URL
function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Validate Email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate Phone
function isValidPhone(phone) {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Show Warning for Suspicious URLs
function checkSuspiciousURL(url) {
  const suspiciousPatterns = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co',
    'shortened', 'redirect', 'phishing'
  ];
  
  const lower = url.toLowerCase();
  for (let pattern of suspiciousPatterns) {
    if (lower.includes(pattern)) {
      showAlert('⚠️ Warning: This URL may be suspicious. Scan with caution!', 'warning');
      return true;
    }
  }
  return false;
}

// ============================================
// Scan History Management
// ============================================
class ScanHistory {
  constructor() {
    this.maxItems = 100;
    this.storageKey = 'qr_scan_history';
  }
  
  getHistory() {
    const history = localStorage.getItem(this.storageKey);
    return history ? JSON.parse(history) : [];
  }
  
  addScan(data, type = 'scan') {
    const history = this.getHistory();
    const scan = {
      id: Date.now(),
      timestamp: Date.now(),
      data: data,
      type: type
    };
    
    history.unshift(scan);
    
    // Keep only last 100 scans
    if (history.length > this.maxItems) {
      history.pop();
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(history));
    return scan;
  }
  
  removeScan(id) {
    let history = this.getHistory();
    history = history.filter(scan => scan.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }
  
  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }
  
  renderHistory(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const history = this.getHistory();
    
    if (history.length === 0) {
      container.innerHTML = '<p class="text-center">No scan history yet</p>';
      return;
    }
    
    container.innerHTML = history.map(scan => `
      <div class="history-item" data-id="${scan.id}">
        <div class="history-content">
          <div class="history-time">${formatDate(scan.timestamp)}</div>
          <div class="history-text">${this.escapeHtml(scan.data)}</div>
        </div>
        <div class="history-actions">
          <button class="btn btn-small btn-secondary" onclick="copyToClipboard('${this.escapeHtml(scan.data)}')">
            Copy
          </button>
          <button class="btn btn-small btn-secondary" onclick="scanHistory.removeScan(${scan.id}); scanHistory.renderHistory('history-list');">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }
  
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// Global instance
const scanHistory = new ScanHistory();

// ============================================
// Form Validation
// ============================================
function validateContactForm(event) {
  event.preventDefault();
  
  const name = document.getElementById('name')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const message = document.getElementById('message')?.value.trim();
  
  if (!name || name.length < 2) {
    showAlert('Please enter a valid name', 'error');
    return false;
  }
  
  if (!isValidEmail(email)) {
    showAlert('Please enter a valid email address', 'error');
    return false;
  }
  
  if (!message || message.length < 10) {
    showAlert('Please enter a message (at least 10 characters)', 'error');
    return false;
  }
  
  // Here you would typically send the form data to a server
  showAlert('Message sent successfully! We will get back to you soon.', 'success');
  
  // Reset form
  event.target.reset();
  
  return false;
}

// ============================================
// Smooth Scroll
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ============================================
// Export functions for global use
// ============================================
window.showAlert = showAlert;
window.copyToClipboard = copyToClipboard;
window.downloadQRCode = downloadQRCode;
window.isValidURL = isValidURL;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.checkSuspiciousURL = checkSuspiciousURL;
window.scanHistory = scanHistory;
window.validateContactForm = validateContactForm;