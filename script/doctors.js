let baseUrl=`http://localhost:5000`
let token = sessionStorage.getItem("token");

if (!token) {
    alert("Please Login First to Come to this Page");
    window.location.href = "./login.html";
}

let doctorContainer=document.querySelector("#doctorContainer");
let searchBtn=document.getElementById("searchBtn");
let specialty=document.getElementById("specialty");

async function getAllDoctor(){
    try {
    let res= await fetch(`${baseUrl}/user/doctors`)
    let out =await res.json()
    displayDoctorData(out.data)
    } catch (error) {
        console.log(error)
    }
}
getAllDoctor()

function  displayDoctorData(data){
    doctorContainer.innerHTML=""
    doctorContainer.innerHTML=`
    
    ${ data.map((elem)=>{
        return `
        <div class="box">
                <h3>Name:-${elem.name}</h3>
                <h3>Email:-${elem.email}</h3>
                <h3>Location:-${elem.location}</h3>
                <h3>Specialty:-${elem.specialty}</h3>
                <a href="./bookAppointment.html" class="btn" data-id=${elem._id} data-name="${elem.name}">Book Appointment</a>
        </div>
        `
    }).join("")}`

    let appointmentBtns=document.querySelectorAll(".btn")
    
    for(let appointmentBtn of appointmentBtns){
        appointmentBtn.addEventListener("click",(e)=>{
                let id=e.target.dataset.id
                let name=e.target.dataset.name
                sessionStorage.setItem("doctorId",id)
                sessionStorage.setItem("doctorName",name)
        })
    }

}

searchBtn.addEventListener("click",()=>{
    let searchValue=document.getElementById("doctorLocation").value;
    fetchDoctorBasedOnLocation(searchValue);
})

specialty.addEventListener("change",()=>{
    let searchValue=specialty.value;
    //console.log(searchValue)
    if(searchValue===""){
        getAllDoctor()
    }else{
        fetchDoctorBasedOnSpecialty(searchValue)
    }
})

async function fetchDoctorBasedOnLocation(location){
    try {
        let res= await fetch(`${baseUrl}/user/doctors/${location}`)
        let out =await res.json()
        displayDoctorData(out.data)
        } catch (error) {
            console.log(error)
        }
}

async function fetchDoctorBasedOnSpecialty(specialty){
    //console.log(specialty);
    try {
        let res= await fetch(`${baseUrl}/user/doctors/specialty/${specialty}`)
        let out =await res.json()
        //console.log(out,"**");
        displayDoctorData(out.data)
        } catch (error) {
            console.log(error)
        }
}

// Function to display doctor's slot availability
async function displaySlotAvailability(doctorId) {
    try {
        const response = await fetch(`${baseUrl}/booking/doctor-slots/${doctorId}`, {
            headers: {
                'Authorization': token
            }
        });
        const data = await response.json();
        
        if (data.data) {
            const availabilityTable = document.getElementById('availabilityTable');
            const slotAvailability = document.getElementById('slotAvailability');
            slotAvailability.style.display = 'block';
            
            let tableHTML = `
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr>
                            <th style="padding: 12px; border: 1px solid #ddd;">Date</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">8 AM - 9 AM</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">9 AM - 10 AM</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">4 PM - 5 PM</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">7 PM - 8 PM</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            Object.entries(data.data).forEach(([date, slots]) => {
                tableHTML += `
                    <tr>
                        <td style="padding: 12px; border: 1px solid #ddd;">${date}</td>
                        ${['8-9', '9-10', '4-5', '7-8'].map(slot => {
                            const slotInfo = slots[slot];
                            const color = slotInfo.available > 0 ? '#4CAF50' : '#ff6b6b';
                            return `
                                <td style="padding: 12px; border: 1px solid #ddd; color: ${color};">
                                    ${slotInfo.available} slots available<br>
                                    (${slotInfo.booked}/${slotInfo.total} booked)
                                </td>
                            `;
                        }).join('')}
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
            `;
            
            availabilityTable.innerHTML = tableHTML;
        }
    } catch (error) {
        console.error("Error fetching slot availability:", error);
        alert("Error loading slot availability");
    }
}

// Modify the existing doctor display function to add a button for viewing slots
function displayDoctors(doctors) {
    const container = document.getElementById("doctorContainer");
    container.innerHTML = doctors.map((doctor) => {
        return `
            <div class="doctorCard">
                <h3>${doctor.name}</h3>
                <p>Specialty: ${doctor.specialty}</p>
                <p>Location: ${doctor.location}</p>
                <button onclick="window.location.href='bookAppointment.html'" 
                        style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    Book Appointment
                </button>
                <button onclick="displaySlotAvailability('${doctor._id}')"
                        style="padding: 8px 16px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    View Slot Availability
                </button>
            </div>
        `;
    }).join("");
}