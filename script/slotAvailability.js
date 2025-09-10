let baseUrl = `http://localhost:5000`;
let token = sessionStorage.getItem("token");

if (!token) {
    alert("Please Login First to View Slot Availability");
    window.location.href = "./login.html";
}

// Function to show loading state
function showLoading(container) {
    container.innerHTML = `
        <div class="loading">
            <p>Loading doctor availability...</p>
        </div>
    `;
}

// Function to show error message
function showError(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
}

// Helper function to format time slots
function formatTimeSlot(slot) {
    const slotMap = {
        '8-9': '8 AM - 9 AM',
        '9-10': '9 AM - 10 AM',
        '4-5': '4 PM - 5 PM',
        '7-8': '7 PM - 8 PM'
    };
    return slotMap[slot] || slot;
}

// Helper function to format date
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to fetch and display all doctors with their slot availability
async function displayAllDoctorsAvailability() {
    const doctorContainer = document.getElementById('doctorContainer');
    showLoading(doctorContainer);

    try {
        // Fetch all doctors
        const doctorsResponse = await fetch(`${baseUrl}/user/doctors`);
        const doctorsData = await doctorsResponse.json();
        
        if (!doctorsData.data || doctorsData.data.length === 0) {
            showError(doctorContainer, "No doctors data available");
            return;
        }

        doctorContainer.innerHTML = ''; // Clear loading/error messages

        // For each doctor, fetch their slot availability
        for (const doctor of doctorsData.data) {
            try {
                const slotsResponse = await fetch(`${baseUrl}/booking/doctor-slots/${doctor._id}`, {
                    headers: {
                        'Authorization': token
                    }
                });
                const slotsData = await slotsResponse.json();

                const doctorCard = document.createElement('div');
                doctorCard.className = 'doctor-card';
                
                let slotsHtml = '';
                if (slotsData.data && Object.keys(slotsData.data).length > 0) {
                    slotsHtml = `
                        <div class="dates-container">
                            ${Object.entries(slotsData.data).map(([date, slots]) => `
                                <div class="date-section">
                                    <h4>${formatDate(date)}</h4>
                                    <table class="slot-table">
                                        <thead>
                                            <tr>
                                                <th>Time Slot</th>
                                                <th>Availability</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${Object.entries(slots).map(([slot, info]) => `
                                                <tr>
                                                    <td>${formatTimeSlot(slot)}</td>
                                                    <td class="${info.available > 0 ? 'slot-available' : 'slot-full'}"
                                                        data-doctor-id="${doctor._id}"
                                                        data-date="${date}"
                                                        data-slot="${slot}"
                                                        data-available="${info.available}">
                                                        ${info.available} slots available
                                                        (${info.booked}/${info.total} booked)
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    slotsHtml = '<p>No slots available for this doctor.</p>';
                }

                doctorCard.innerHTML = `
                    <h3>${doctor.name}</h3>
                    <p><strong>Specialty:</strong> ${doctor.specialty}</p>
                    <p><strong>Location:</strong> ${doctor.location}</p>
                    ${slotsHtml}
                    <a href="bookAppointment.html" class="book-btn" 
                       onclick="sessionStorage.setItem('doctorId', '${doctor._id}'); 
                               sessionStorage.setItem('doctorName', '${doctor.name}');">
                        Book Appointment
                    </a>
                `;
                doctorContainer.appendChild(doctorCard);
                
            } catch (error) {
                console.error(`Error fetching slots for doctor ${doctor._id}:`, error);
                const errorCard = document.createElement('div');
                errorCard.className = 'doctor-card error-message';
                errorCard.innerHTML = `
                    <h3>${doctor.name}</h3>
                    <p>Error loading availability data</p>
                `;
                doctorContainer.appendChild(errorCard);
            }
        }

        if (doctorContainer.children.length === 0) {
            showError(doctorContainer, "No available slots found");
        }
    } catch (error) {
        console.error("Error fetching doctors:", error);
        showError(doctorContainer, "Error loading doctors data. Please try again later.");
    }
}

// Search functionality
document.getElementById('searchBtn').addEventListener('click', async () => {
    const location = document.getElementById('doctorLocation').value.toLowerCase();
    const specialty = document.getElementById('specialty').value;

    const doctorCards = document.querySelectorAll('.doctor-card');
    let visibleCards = 0;

    doctorCards.forEach(card => {
        if (card.classList.contains('error-message')) return;

        const cardLocation = card.querySelector('p:nth-child(3)').textContent.toLowerCase().replace('location: ', ''); // Adjusted selector
        const cardSpecialty = card.querySelector('p:nth-child(2)').textContent.replace('Specialty: ', ''); // Adjusted selector

        const locationMatch = !location || cardLocation.includes(location);
        const specialtyMatch = !specialty || cardSpecialty.includes(specialty);

        card.style.display = locationMatch && specialtyMatch ? 'block' : 'none';
        if (locationMatch && specialtyMatch) visibleCards++;
    });

    const doctorContainer = document.getElementById('doctorContainer');
    // Remove previous "No doctors found" message if exists
    const existingNoResults = doctorContainer.querySelector('.no-results-message');
    if (existingNoResults) {
        existingNoResults.remove();
    }

    if (visibleCards === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'error-message no-results-message'; // Added a specific class
        noResults.innerHTML = '<p>No doctors found matching your search criteria</p>';
        doctorContainer.appendChild(noResults);
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', displayAllDoctorsAvailability);

// No longer needed functions (from old structure)
// function displaySlotAvailability(containerId) { ... }
// async function fetchDoctorSlots(doctorId) { ... }
// function formatSlotTime(slot) { ... } // Consolidated with formatTimeSlot 