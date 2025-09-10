const baseUrl = "http://localhost:5000";

// Function to fetch and display all doctors with their slot availability
async function displayAllDoctorsAvailability() {
    try {
        // Fetch all doctors
        const doctorsResponse = await fetch(`${baseUrl}/user/doctors`);
        const doctorsData = await doctorsResponse.json();
        
        if (!doctorsData.data) {
            console.error("No doctors data received");
            return;
        }

        const availabilityContainer = document.getElementById('availabilityContainer');
        availabilityContainer.innerHTML = '';

        // For each doctor, fetch their slot availability
        for (const doctor of doctorsData.data) {
            try {
                const slotsResponse = await fetch(`${baseUrl}/booking/doctor-slots/${doctor._id}`);
                const slotsData = await slotsResponse.json();

                if (slotsData.data) {
                    const today = new Date().toISOString().split('T')[0];
                    const todaySlots = slotsData.data[today] || {};

                    const doctorCard = document.createElement('div');
                    doctorCard.className = 'doctor-card';
                    doctorCard.innerHTML = `
                        <h3>${doctor.name}</h3>
                        <p>Specialty: ${doctor.specialty}</p>
                        <p>Location: ${doctor.location}</p>
                        <table class="slot-table">
                            <thead>
                                <tr>
                                    <th>Time Slot</th>
                                    <th>Availability</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(todaySlots).map(([slot, info]) => `
                                    <tr>
                                        <td>${formatTimeSlot(slot)}</td>
                                        <td class="${info.available > 0 ? 'slot-available' : 'slot-full'}">
                                            ${info.available} slots available
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <a href="bookAppointment.html" class="book-btn" 
                           onclick="sessionStorage.setItem('doctorId', '${doctor._id}'); 
                                   sessionStorage.setItem('doctorName', '${doctor.name}');">
                            Book Appointment
                        </a>
                    `;
                    availabilityContainer.appendChild(doctorCard);
                }
            } catch (error) {
                console.error(`Error fetching slots for doctor ${doctor._id}:`, error);
            }
        }
    } catch (error) {
        console.error("Error fetching doctors:", error);
    }
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

// Search functionality
document.getElementById('searchBtn').addEventListener('click', async () => {
    const location = document.getElementById('searchLocation').value.toLowerCase();
    const specialty = document.getElementById('searchSpecialty').value;

    const doctorCards = document.querySelectorAll('.doctor-card');
    doctorCards.forEach(card => {
        const cardLocation = card.querySelector('p:nth-child(3)').textContent.toLowerCase();
        const cardSpecialty = card.querySelector('p:nth-child(2)').textContent;

        const locationMatch = !location || cardLocation.includes(location);
        const specialtyMatch = !specialty || cardSpecialty.includes(specialty);

        card.style.display = locationMatch && specialtyMatch ? 'block' : 'none';
    });
});

// Initial load
displayAllDoctorsAvailability();
