// Elements
const billTotalInput = document.getElementById('billTotal');
const tipSlider = document.getElementById('tipSlider');
const tipPercentageDisplay = document.getElementById('tipPercentageDisplay');
const tipAmountDisplay = document.getElementById('tipAmountDisplay');
const grandTotalDisplay = document.getElementById('grandTotalDisplay');
const peopleList = document.getElementById('peopleList');
const addPersonBtn = document.getElementById('addPersonBtn');
const leftoverWarning = document.getElementById('leftoverWarning');

// State
let state = {
  billTotal: 0,
  tipPercentage: 15,
  people: [
    { id: generateId(), name: 'You', isLocked: false, lockedAmount: 0 },
    { id: generateId(), name: 'Friend', isLocked: false, lockedAmount: 0 }
  ],
  activeColors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
};

// Utils
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function getAvatarColor(index) {
  return state.activeColors[index % state.activeColors.length];
}

// Calculations
function calculateTotals() {
  const tipAmount = state.billTotal * (state.tipPercentage / 100);
  const grandTotal = state.billTotal + tipAmount;
  
  return { tipAmount, grandTotal };
}

function distributeAmounts() {
  const { grandTotal } = calculateTotals();
  
  const lockedPeople = state.people.filter(p => p.isLocked);
  const unlockedPeople = state.people.filter(p => !p.isLocked);
  
  // Total locked amount
  const totalLockedAmount = lockedPeople.reduce((sum, p) => sum + p.lockedAmount, 0);
  
  // Remaining to distribute
  const remainingTotal = Math.max(0, grandTotal - totalLockedAmount);
  
  // Distribute equally among unlocked people
  let perPersonAmount = 0;
  if (unlockedPeople.length > 0) {
    perPersonAmount = remainingTotal / unlockedPeople.length;
  }
  
  // Assign calculated amounts
  const updatedPeople = state.people.map(p => {
    return {
      ...p,
      currentAmount: p.isLocked ? p.lockedAmount : perPersonAmount
    };
  });
  
  // Check if locked items exceed total
  const isOverflow = grandTotal > 0 && totalLockedAmount > grandTotal;
  if (isOverflow) {
    leftoverWarning.classList.remove('hidden');
  } else {
    leftoverWarning.classList.add('hidden');
  }
  
  return updatedPeople;
}

// Render Data
function updateUI() {
  // Update slider styling
  const sliderPercent = (state.tipPercentage / tipSlider.max) * 100;
  tipSlider.style.background = `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${sliderPercent}%, rgba(255,255,255,0.1) ${sliderPercent}%, rgba(255,255,255,0.1) 100%)`;
  
  tipPercentageDisplay.textContent = `${state.tipPercentage}%`;
  
  const { tipAmount, grandTotal } = calculateTotals();
  tipAmountDisplay.textContent = formatCurrency(tipAmount);
  grandTotalDisplay.textContent = formatCurrency(grandTotal);
  
  // Render people
  renderPeopleCards();
}

function renderPeopleCards() {
  peopleList.innerHTML = '';
  const distributedPeople = distributeAmounts();
  
  distributedPeople.forEach((person, index) => {
    const card = document.createElement('div');
    card.className = 'person-card';
    
    // Dynamic color banner
    const avatarColor = getAvatarColor(index);
    const initial = person.name.charAt(0).toUpperCase() || '?';
    
    // Auto percentage string if total > 0
    const { grandTotal } = calculateTotals();
    const percentStr = grandTotal > 0 ? ((person.currentAmount / grandTotal) * 100).toFixed(0) + '%' : '0%';
    
    card.innerHTML = `
      <div class="avatar" style="background: linear-gradient(135deg, ${avatarColor}, #00000080); box-shadow: 0 4px 10px ${avatarColor}40;">
        ${initial}
      </div>
      <div class="person-info">
        <input type="text" class="person-name" value="${person.name}" data-id="${person.id}" placeholder="Name...">
        <span class="person-share">${percentStr} of total</span>
      </div>
      <div class="person-amount-box">
        <span>$</span>
        <input type="number" class="person-amount-input" data-id="${person.id}" value="${person.currentAmount.toFixed(2)}" step="0.01" min="0">
      </div>
      <button class="delete-btn" data-id="${person.id}" ${state.people.length <= 1 ? 'disabled' : ''}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    `;
    
    peopleList.appendChild(card);
  });
  
  attachPersonEventListeners();
}

// Event Listeners
function attachPersonEventListeners() {
  // Name updates
  document.querySelectorAll('.person-name').forEach(input => {
    input.addEventListener('input', (e) => {
      const id = e.target.getAttribute('data-id');
      const person = state.people.find(p => p.id === id);
      if (person) {
        person.name = e.target.value;
        // Update avatar instantly visually
        const card = e.target.closest('.person-card');
        const initial = person.name.charAt(0).toUpperCase() || '?';
        card.querySelector('.avatar').textContent = initial;
      }
    });
  });
  
  // Amount override (locks the person's amount)
  document.querySelectorAll('.person-amount-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      const val = parseFloat(e.target.value) || 0;
      const person = state.people.find(p => p.id === id);
      
      if (person) {
        person.isLocked = true;
        person.lockedAmount = val;
        updateUI();
      }
    });
  });
  
  // Delete person
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (state.people.length <= 1) return;
      
      const id = e.currentTarget.getAttribute('data-id');
      state.people = state.people.filter(p => p.id !== id);
      updateUI();
    });
  });
}

billTotalInput.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value) || 0;
  state.billTotal = value;
  // Unlock everyone when the main bill changes to recalculate evenly
  state.people.forEach(p => p.isLocked = false);
  updateUI();
});

tipSlider.addEventListener('input', (e) => {
  state.tipPercentage = parseInt(e.target.value, 10);
  state.people.forEach(p => p.isLocked = false); // Unlock to redistribute fairness
  updateUI();
});

addPersonBtn.addEventListener('click', () => {
  state.people.push({
    id: generateId(),
    name: 'Friend ' + state.people.length,
    isLocked: false,
    lockedAmount: 0
  });
  updateUI();
});

// Init
updateUI();
