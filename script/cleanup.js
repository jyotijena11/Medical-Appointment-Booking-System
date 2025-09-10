let baseUrl = `http://localhost:5000`;
let token = sessionStorage.getItem("token");

if (!token) {
    alert("Please Login First");
    window.location.href = "./login.html";
}

async function removePastAppointments() {
    try {
        const response = await fetch(`${baseUrl}/booking/remove-past-appointments`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(`Successfully removed ${data.deletedCount} past appointments`);
            // Refresh the page to show updated data
            window.location.reload();
        } else {
            alert(data.msg || "Error removing past appointments");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error removing past appointments");
    }
}

// Call the function when the script loads
removePastAppointments(); 