let baseUrl=`http://localhost:5000`


document.addEventListener('DOMContentLoaded', function() {
    let dtToday = new Date();
    let month = dtToday.getMonth() + 1;
    let day = dtToday.getDate();
    let year = dtToday.getFullYear();
  
    if (month < 10)
      month = '0' + month.toString();
    if (day < 10)
      day = '0' + day.toString();
  
    // Set minimum date to today
    let minDate = year + '-' + month + '-' + day;
    // Set maximum date to 3 days from now
    let maxDate = year + '-' + month + '-' + (day+3);
    
    document.getElementById('inputdate').setAttribute('min', minDate);
    document.getElementById('inputdate').setAttribute('max', maxDate);
  });
  
let btnBook=document.getElementById("bookAppointment");
btnBook.addEventListener("click",()=>{
    let date=document.getElementById("inputdate").value;
    let slot=document.getElementById("slotSelect").value;
    let familyMember=document.getElementById("familyMemberSelect").value;
    let token=sessionStorage.getItem("token");
    let doctorId=sessionStorage.getItem("doctorId");
    let doctorName=sessionStorage.getItem("doctorName");
    
    // Validate if the selected time slot is in the past for today's date
    if(date === new Date().toISOString().split('T')[0]) {
        const currentHour = new Date().getHours();
        const [slotStartHour] = slot.split('-').map(Number);
        
        // Convert slot start hour to 24-hour format
        let slotStartHour24 = slotStartHour;
        // For PM slots (4-5 PM, 7-8 PM), add 12 to convert to 24-hour format
        if (slotStartHour < 12) {
            slotStartHour24 = slotStartHour + 12;
        }
        
        if(currentHour >= slotStartHour24) {
            alert("Cannot book appointments for past time slots today");
            return;
        }
    }
    
    if(!token){
        alert("Please Login First to Book an Appointment!!")
        window.location.href="./Login.html"
    }else if(date==""||slot==""||familyMember==""){
        alert("Please fill all the fields")
    }else{
       let obj={
        doctorId:doctorId,
        doctorName:doctorName,
        bookingDate:date,
        bookingSlot:slot,
        familyMember:familyMember,
        userEmail: sessionStorage.getItem("email")
       }
       //console.log(obj);
       bookAnAppointment(obj,token);
    }
    
})

async function bookAnAppointment(obj,token){

    try {
        let res=await fetch(`${baseUrl}/booking/create`,{
         method:'POST',
         headers:{
             'Content-type':'application/json',
             Authorization:`${token}`
         },
         body:JSON.stringify(obj)
        })
        let out=await res.json();
        console.log(out);
        if(out.msg=="This Slot is Not Available."){
         alert("This Slot is Not Available.")
        }else if(out.msg.includes("Appointment booked successfully")){
         alert(`Your booking is confirmed on ${obj.bookingDate}`)
         window.location.href = "./appointment.html"; // Redirect to appointments page after successful booking
        }else{
         alert(out.msg);
        }
     } catch (error) {
         console.log("err",error.message)
         alert("Something went wrong booking an appointment!!!!")
     }
}