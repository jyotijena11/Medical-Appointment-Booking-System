let baseUrl=`http://localhost:5000`;

let token=sessionStorage.getItem("token");

if(token){
    
let cont=document.getElementById("displayAppointment");

async function getAllAppointments(){
    let role=sessionStorage.getItem("role");
    let name=sessionStorage.getItem("name");
    let userId = sessionStorage.getItem("userId");
    
    console.log("Debug info:", {
        role,
        name,
        userId,
        token: token ? "Present" : "Missing"
    });

    try {
        let res=await fetch(`${baseUrl}/booking/paticularUser`,{
            method:'POST',
            headers:{
                'Content-type':'application/json',
                Authorization:`${token}`
            },
            body: JSON.stringify({ userId, role })
           })
           let out=await res.json();
           console.log("Server response:", out);
           
           if(out.Data && Array.isArray(out.Data)) {
               if(out.Data.length === 0) {
                   cont.innerHTML = `<h1 style="text-align: center; margin-bottom:20px">No appointments found for ${role} ${name}</h1>`;
               } else {
                   displayAllAppointments(out.Data, name, role);
               }
           } else {
               console.log("Invalid data format received:", out);
               cont.innerHTML = `<h1 style="text-align: center; margin-bottom:20px">Error: Invalid data format received</h1>`;
           }
    } catch (error) {
        console.log("Error details:", {
            message: error.message,
            stack: error.stack
        });
        cont.innerHTML = `<h1 style="text-align: center; margin-bottom:20px">Error loading appointments. Please try again later.</h1>`;
    }
}

function displayAllAppointments(arr, name, role) {
    console.log("Displaying appointments:", arr);
    
    if (!Array.isArray(arr)) {
        console.error("Invalid data format: not an array");
        cont.innerHTML = `<h1 style="text-align: center; margin-bottom:20px">Error: Invalid data format</h1>`;
        return;
    }

    cont.innerHTML = `
        <h1 style="text-align: center; margin-bottom:20px">All Bookings of ${role} ${name}</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr>
                    <th style="padding: 12px; border: 1px solid #ddd;">SI NO.</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Patient Email</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Doctor Name</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Date</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Time Slot</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Family Member</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Action</th>
                </tr>
            </thead>
            <tbody>
                ${arr.map((elem, index) => {
                    const appointmentDate = new Date(elem.bookingDate);
                    const currentDate = new Date();
                    appointmentDate.setHours(0, 0, 0, 0);
                    currentDate.setHours(0, 0, 0, 0);
                    const isPastAppointment = appointmentDate < currentDate;
                    
                    return `
                        <tr>
                            <td style="padding: 12px; border: 1px solid #ddd;">${index + 1}</td>
                            <td style="padding: 12px; border: 1px solid #ddd;">${elem.userEmail || 'N/A'}</td>
                            <td style="padding: 12px; border: 1px solid #ddd;">${elem.doctorName || 'N/A'}</td>
                            <td style="padding: 12px; border: 1px solid #ddd;">${elem.bookingDate || 'N/A'}</td>
                            <td style="padding: 12px; border: 1px solid #ddd;">${formatTimeSlot(elem.bookingSlot)}</td>
                            <td style="padding: 12px; border: 1px solid #ddd;">${elem.familyMember ? elem.familyMember.charAt(0).toUpperCase() + elem.familyMember.slice(1) : 'N/A'}</td>
                            <td style="padding: 12px; border: 1px solid #ddd;">
                                ${!isPastAppointment ? `
                                    <button class="cancelAppointment" data-id="${elem._id}" style="padding: 8px 16px; background-color: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                        <span>Cancel Appointment</span>
                                    </button>
                                ` : 'Past Appointment'}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Add event listeners for buttons
    let cancelAppointmentBtns = document.querySelectorAll(".cancelAppointment");
    for(let cancelAppointmentBtn of cancelAppointmentBtns) {
        cancelAppointmentBtn.addEventListener("click", (e) => {
            const button = e.target.closest('.cancelAppointment');
            if (button) {
                const id = button.dataset.id;
                if (confirm('Are you sure you want to cancel this appointment?')) {
                    removeAppointment(id, token);
                }
            }
        });
    }
}

function formatTimeSlot(slot) {
    if (!slot) return 'N/A';
    const [start, end] = slot.split('-');
    const startHour = parseInt(start);
    const endHour = parseInt(end);
    const startPeriod = startHour >= 12 ? 'PM' : 'AM';
    const endPeriod = endHour >= 12 ? 'PM' : 'AM';
    const startHour12 = startHour > 12 ? startHour - 12 : startHour;
    const endHour12 = endHour > 12 ? endHour - 12 : endHour;
    return `${startHour12}:00 ${startPeriod} to ${endHour12}:00 ${endPeriod}`;
}

getAllAppointments();

async function removeAppointment(id, token) {
    try {
        const role = sessionStorage.getItem("role");
        let res = await fetch(`${baseUrl}/booking/remove/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-type': 'application/json',
                Authorization: `${token}`
            },
            body: JSON.stringify({ role })
        });
        let out = await res.json();
        console.log("Delete response:", out);
        
        if (res.ok) {
            getAllAppointments();
            alert('Appointment cancelled successfully');
        } else {
            alert(out.msg || 'Failed to cancel appointment');
        }
    } catch (error) {
        console.log("Error deleting appointment:", error);
        alert("Failed to cancel appointment. Please try again.");
    }
}
} else {
    alert("Login First to Come to this Page");
    window.location.href = "./login.html";
}