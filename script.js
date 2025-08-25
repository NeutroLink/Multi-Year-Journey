document.addEventListener('DOMContentLoaded', function() {
    const yearsContainer = document.getElementById('yearsContainer');
    const moneySlider = document.getElementById('moneySlider');
    const currentValue = document.getElementById('currentValue');
    const progressFill = document.getElementById('progressFill');
    const weeksPassed = document.getElementById('weeksPassed');
    const journeyProgress = document.getElementById('journeyProgress');
    const progressPercent = document.getElementById('progressPercent');
    const tooltip = document.getElementById('tooltip');
    const notification = document.getElementById('notification');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyDatesButton = document.getElementById('applyDates');
    
    // Default dates
    let startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    
    let endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 7); // 7 years from start
    
    // Load saved data from localStorage
    let savedWeeks = JSON.parse(localStorage.getItem('journeyWeeks')) || {};
    let savedSliderValue = localStorage.getItem('journeySliderValue') || 0;
    let savedStartDate = localStorage.getItem('journeyStartDate') || startDate.toISOString().split('T')[0];
    let savedEndDate = localStorage.getItem('journeyEndDate') || endDate.toISOString().split('T')[0];
    
    // Set the date inputs to the saved dates
    startDateInput.value = savedStartDate;
    endDateInput.value = savedEndDate;
    startDate = new Date(savedStartDate);
    endDate = new Date(savedEndDate);
    
    // Format date as "Month Day, Year"
    function formatDate(date) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    // Calculate total weeks between two dates
    function calculateTotalWeeks(start, end) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 7);
    }
    
    // Save week state to localStorage
    function saveWeekState(endTimestamp, isFilled) {
        savedWeeks[endTimestamp] = isFilled;
        localStorage.setItem('journeyWeeks', JSON.stringify(savedWeeks));
    }
    
    // Save slider value to localStorage
    function saveSliderValue(value) {
        localStorage.setItem('journeySliderValue', value);
    }
    
    // Save dates to localStorage
    function saveDates() {
        localStorage.setItem('journeyStartDate', startDate.toISOString().split('T')[0]);
        localStorage.setItem('journeyEndDate', endDate.toISOString().split('T')[0]);
    }
    
    // Show notification
    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.classList.add('show');
        
        if (isError) {
            notification.classList.add('error');
        } else {
            notification.classList.remove('error');
        }
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Build the years grid
    function buildYearsGrid() {
        // Clear existing grid
        yearsContainer.innerHTML = '';
        
        // Calculate total weeks and years
        const totalWeeks = calculateTotalWeeks(startDate, endDate);
        const totalYears = Math.ceil(totalWeeks / 52);
        
        // Update total weeks display
        document.getElementById('totalWeeks').textContent = totalWeeks;
        
        // Create year columns
        for (let year = 1; year <= totalYears; year++) {
            const yearColumn = document.createElement('div');
            yearColumn.className = 'year-column';
            
            const yearTitle = document.createElement('div');
            yearTitle.className = 'year-title';
            
            // Year title now only shows the year number without dates
            yearTitle.textContent = `Year ${year}`;
            yearColumn.appendChild(yearTitle);
            
            const weeksGrid = document.createElement('div');
            weeksGrid.className = 'weeks-grid';
            
            // Calculate the start and end dates of this year
            const yearStartDate = new Date(startDate);
            yearStartDate.setDate(yearStartDate.getDate() + (year - 1) * 52 * 7);
            
            const yearEndDate = new Date(yearStartDate);
            yearEndDate.setDate(yearEndDate.getDate() + 52 * 7 - 1);
            
            // If this is the last year, adjust to the actual end date
            if (year === totalYears && yearEndDate > endDate) {
                yearEndDate.setTime(endDate.getTime());
            }
            
            // Calculate weeks for this year
            const weeksInYear = (year === totalYears) 
                ? Math.ceil((yearEndDate - yearStartDate) / (1000 * 60 * 60 * 24 * 7)) 
                : 52;
            
            // Create weeks for this year
            for (let week = 1; week <= weeksInYear; week++) {
                const weekSquare = document.createElement('div');
                weekSquare.className = 'week';
                weekSquare.dataset.year = year;
                weekSquare.dataset.week = week;
                
                // Calculate the start and end dates of this week
                const weekStartDate = new Date(yearStartDate);
                weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);
                
                const weekEndDate = new Date(weekStartDate);
                weekEndDate.setDate(weekEndDate.getDate() + 6);
                
                // If this is the last week of the last year, adjust to the actual end date
                if (year === totalYears && week === weeksInYear && weekEndDate > endDate) {
                    weekEndDate.setTime(endDate.getTime());
                }
                
                // Store date information as data attributes
                weekSquare.dataset.startDate = formatDate(weekStartDate);
                weekSquare.dataset.endDate = formatDate(weekEndDate);
                weekSquare.dataset.endTimestamp = weekEndDate.getTime();
                
                // Check if this week has been manually set or if it has already passed
                const endTimestamp = weekEndDate.getTime().toString();
                const manuallySet = savedWeeks.hasOwnProperty(endTimestamp);
                const isFilled = manuallySet ? savedWeeks[endTimestamp] : (new Date() >= weekEndDate);
                
                if (isFilled) {
                    weekSquare.classList.add('filled');
                }
                
                // Add event listeners for tooltip
                weekSquare.addEventListener('mouseenter', function(e) {
                    const startDate = this.dataset.startDate;
                    const endDate = this.dataset.endDate;
                    tooltip.textContent = `${startDate} - ${endDate}`;
                    tooltip.classList.add('show');
                });
                
                weekSquare.addEventListener('mousemove', function(e) {
                    // Position tooltip near the cursor
                    tooltip.style.left = e.pageX + 10 + 'px';
                    tooltip.style.top = e.pageY - 30 + 'px';
                });
                
                weekSquare.addEventListener('mouseleave', function() {
                    tooltip.classList.remove('show');
                });
                
                weekSquare.addEventListener('click', function() {
                    this.classList.toggle('filled');
                    const endTimestamp = this.dataset.endTimestamp;
                    const isFilled = this.classList.contains('filled');
                    saveWeekState(endTimestamp, isFilled);
                    updateStats();
                    
                    // Show notification for manual toggle
                    const startDate = this.dataset.startDate;
                    const endDate = this.dataset.endDate;
                    const action = isFilled ? 'marked as passed' : 'unmarked';
                    showNotification(`Week ${startDate} - ${endDate} ${action}`);
                });
                
                weeksGrid.appendChild(weekSquare);
            }
            
            yearColumn.appendChild(weeksGrid);
            yearsContainer.appendChild(yearColumn);
        }
        
        updateStats();
    }
    
    // Update slider progress bar
    function updateSlider() {
        const value = moneySlider.value;
        const percentage = (value / 150000) * 100;
        
        currentValue.textContent = `$${parseInt(value).toLocaleString()}`;
        progressFill.style.width = `${percentage}%`;
        progressPercent.textContent = `${percentage.toFixed(1)}%`;
        
        // Save slider value
        saveSliderValue(value);
    }
    
    // Update statistics
    function updateStats() {
        const allWeeks = document.querySelectorAll('.week');
        const filledWeeks = document.querySelectorAll('.week.filled').length;
        const totalWeeks = allWeeks.length;
        
        weeksPassed.textContent = filledWeeks;
        
        // Calculate journey progress percentage
        const progressPercentage = totalWeeks > 0 ? (filledWeeks / totalWeeks) * 100 : 0;
        journeyProgress.textContent = `${progressPercentage.toFixed(1)}%`;
    }
    
    // Check for newly passed weeks
    function checkForNewlyPassedWeeks() {
        const now = new Date();
        const allWeeks = document.querySelectorAll('.week');
        let newWeeksCount = 0;
        
        allWeeks.forEach(week => {
            const endTimestamp = week.dataset.endTimestamp;
            
            // If the week hasn't been manually set and has now passed
            if (!savedWeeks.hasOwnProperty(endTimestamp) && now >= new Date(parseInt(endTimestamp)) && !week.classList.contains('filled')) {
                week.classList.add('filled');
                saveWeekState(endTimestamp, true);
                newWeeksCount++;
            }
        });
        
        if (newWeeksCount > 0) {
            updateStats();
            showNotification(`${newWeeksCount} new week${newWeeksCount > 1 ? 's' : ''} automatically marked as passed`);
        }
    }
    
    // Apply new dates
    applyDatesButton.addEventListener('click', function() {
        const newStartDate = new Date(startDateInput.value);
        const newEndDate = new Date(endDateInput.value);
        
        // Validate dates
        if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
            showNotification('Please enter valid dates', true);
            return;
        }
        
        if (newStartDate >= newEndDate) {
            showNotification('End date must be after start date', true);
            return;
        }
        
        const daysDiff = Math.ceil((newEndDate - newStartDate) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
            showNotification('Journey must be at least one week long', true);
            return;
        }
        
        // Update dates
        startDate = newStartDate;
        endDate = newEndDate;
        saveDates();
        buildYearsGrid();
        showNotification('Journey timeline updated successfully');
    });
    
    // Set slider value from saved data
    moneySlider.value = savedSliderValue;
    
    moneySlider.addEventListener('input', updateSlider);
    
    // Initialize
    buildYearsGrid();
    updateSlider();
    
    // Check for newly passed weeks every minute
    setInterval(checkForNewlyPassedWeeks, 60000);
    
    // Check immediately on page load
    checkForNewlyPassedWeeks();
});