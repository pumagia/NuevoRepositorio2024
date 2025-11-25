document.addEventListener('DOMContentLoaded', () => {
    // Definición de elementos y variables
    const calendarEl = document.getElementById('calendar');
    const messageDiv = document.getElementById('message');
    const form = document.getElementById('reservationForm');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const cancelDiv = document.createElement('div');
   const BACKEND_URL2 = 'https://loscardoscdu.onrender.com';
   //const BACKEND_URL2 = 'http://localhost:8080';
    const correoAdmi ='gabrielalba1@hotmail.com';
    cancelDiv.className = 'mt-3 text-center';
    calendarEl.parentNode.insertBefore(cancelDiv, calendarEl.nextSibling);

    const currentUser = localStorage.getItem('userId');
    const nn = localStorage.getItem('user');
    const emailus = localStorage.getItem('email');
    let selectedEventId = null;
    let occupiedDates = [];

    // Inicialización FullCalendar
   const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: ''
    },
    validRange: {
        start: new Date()
    },
    eventClick: function(info) {
        const eventId = info.event.id;
        const eventData = occupiedDates.find(reserva => reserva.id == eventId); 

        cancelDiv.innerHTML = '';
        messageDiv.style.display = 'none';

        if (selectedEventId === eventId) {
            selectedEventId = null;
        } else {
            selectedEventId = eventId;
        }

        displayOccupiedDatesOnCalendar(occupiedDates);

        if (selectedEventId) {
            if (eventData && eventData.userId == currentUser) {
                cancelDiv.innerHTML = `
                    <button class="btn btn-danger btn-sm">Cancelar mi reserva seleccionada</button>
                `;
                
              
                cancelDiv.querySelector('button').onclick = () => {
                    
                  
                    fetch(`${BACKEND_URL2}/api/agendas/${selectedEventId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('No se pudo obtener la reserva para la cancelación.');
                        }
                        return response.json();
                    })
                    .then(data => {
                        
                        localStorage.setItem('cancelData', JSON.stringify(data));
                        console.log('Datos de la reserva guardados en localStorage:', data);

                        
                        return fetch(`${BACKEND_URL2}/api/agendas/${selectedEventId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                            }
                        });
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('No se pudo cancelar la reserva en el servidor.');
                        }
                        
                       
                        const cancelData = JSON.parse(localStorage.getItem('cancelData'));
                        
                        
                        const emailBody = {
                            "casunto": "Notificación de Cancelación de Reserva",
                            "cdestinatario": cancelData.correo, 
                            "cdestinatario2": correoAdmi, 
                            "cfechaInicial": cancelData.fecha_inicio, 
                            "cfechaFinal": cancelData.fecha_fin,
                            "cnombreCompleto": cancelData.nombreyapellido 
                        };

                        return fetch(`${BACKEND_URL2}/api/cancelar-correo`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                                
                            },
                            body: JSON.stringify(emailBody)
                        });
                    })
                    .then(emailResponse => {
                        
                        if (!emailResponse.ok) {
                            console.warn('La reserva fue cancelada, pero hubo un error al enviar el correo de notificación.');
                            
                        } else {
                            console.log('Correo de cancelación enviado con éxito.');
                        }
                        
                        
                        occupiedDates = occupiedDates.filter(reserva => reserva.id !== selectedEventId);
                        selectedEventId = null;
                        displayOccupiedDatesOnCalendar(occupiedDates);
                        cancelDiv.innerHTML = '';
                        
                        
                        
                        localStorage.removeItem('cancelData');

                       location.reload(); 
                     
                    })
                    .catch(error => {
                        
                        console.error('Error en el proceso de cancelación o envío de correo:', error);
                        showMessage('Hubo un error al cancelar la reserva.', 'danger');
                       
                    });
                };
            } else {
                showMessage('Esta reserva pertenece a otro usuario y no puede ser cancelada por ti.', 'warning');
            }
        }
    }
});
//------------------------------------------------------------------------------------------------------

const displayOccupiedDatesOnCalendar = (occupiedDatesArray) => {
    const events = occupiedDatesArray.map((date) => {
        
        const endDate = new Date(date.end);

        endDate.setDate(endDate.getDate() + 1);

        return {
            id: date.id,
            title: date.userId == currentUser ? 'Mi Reserva' : 'Reservado',
            start: date.start,
            end: endDate.toISOString().slice(0, 10),
            color: date.id == selectedEventId ? '#ffe066' : '#eb838d'
        };
    });
    calendar.removeAllEvents();
    calendar.addEventSource(events);
    calendar.render();
 };

    const isOverlapping = (newStart, newEnd) => {
        for (const occupied of occupiedDates) {
            const occupiedStart = new Date(occupied.start);
            const occupiedEnd = new Date(occupied.end);
            if (newStart <= occupiedEnd && newEnd >= occupiedStart) {
                return true;
            }
        }
        return false;
    };

    const showMessage = (msg, type) => {
        messageDiv.textContent = msg;
        messageDiv.className = `alert mt-4 text-center alert-${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    };

    
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
       

        
        if (startDate === '' || endDate === '') {
            showMessage('Por favor, selecciona ambas fechas.', 'danger');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            showMessage('La fecha de ingreso, no puede ser posterior a la fecha de egreso.', 'danger');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            showMessage('No puedes seleccionar  fecha de hoy.', 'danger');
            return;
        }

        if (isOverlapping(start, end)) {
            showMessage('Las fechas seleccionadas ya están ocupadas. Por favor, elige otro período.', 'danger');
            return;
        }

        
        const newReservation = {
            fecha_inicio: startDate,
            fecha_fin: endDate,
            id_usuario: currentUser,
            nombreyapellido: nn,
            correo: emailus
        };

        
        localStorage.setItem('startDate', startDate);
        localStorage.setItem('endDate', endDate);
        
        const diferenciaDia = calcularDiferenciaDias(endDate, startDate);
        const diferenciaDiass =diferenciaDia.toString();
        localStorage.setItem('diferenciaDias', diferenciaDiass);

        
        const preciototal = diferenciaDia * 70;
        const ptotal = preciototal.toString();
        localStorage.setItem('preciototal', preciototal);



        
        fetch(`${BACKEND_URL2}/api/agendas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            },
            body: JSON.stringify(newReservation)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Hubo un error al guardar la reserva en el servidor.');
            }
            return response.json(); 
        })
        .then(async data => {

           
            
               const resultado = await procesarFechasYEnviarCorreo(
                    startDate,
                    endDate,
                    diferenciaDiass,
                    ptotal 
                ); console.log(resultado);

                 
            
            form.reset();

           location.reload(); 
   
            
        })
        .catch(error => {
            console.error('Error al enviar la reserva:', error);
            showMessage('Hubo un error al realizar la reserva. Inténtalo de nuevo.', 'danger');
        });
    });

    
    fetch(`${BACKEND_URL2}/api/agendas`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
              window.location.href = '/';
            throw new Error('La respuesta de la red no fue exitosa');

        }
        return response.json();
    })
    .then(data => {
        occupiedDates = data.map(agenda => ({
            id: agenda.id_agenda,
            userId: agenda.id_usuario,
            end: agenda.fecha_fin,
            start: agenda.fecha_inicio
        }));
        displayOccupiedDatesOnCalendar(occupiedDates);
    })
    .catch(error => {
        console.error('Paso de error: Hubo un problema con la operación fetch.', error);
        calendar.render();
    });

   
function calcularDiferenciaDias(fechaFinal, fechaInicial) {
    
    const finalDate = (typeof fechaFinal === 'string') ? new Date(fechaFinal) : fechaFinal;
    const inicialDate = (typeof fechaInicial === 'string') ? new Date(fechaInicial) : fechaInicial;
    
    
    if (isNaN(finalDate.getTime()) || isNaN(inicialDate.getTime())) {
        console.error("Error: Una de las fechas de entrada no es un formato de fecha válido.");
        return NaN; 
    }

    
    const milisegundosEnUnDia = 1000 * 60 * 60 * 24;
    const diferenciaMilisegundos = finalDate.getTime() - inicialDate.getTime();
    
    return Math.round(diferenciaMilisegundos / milisegundosEnUnDia);
}



function procesarFechasYEnviarCorreo(fecha1, fecha2, diferenciaDiass, ptotal) {
    
    
    
    const emailuser = localStorage.getItem('email');
    const nombreYApellido = localStorage.getItem('user');
    
    

    
    const datosParaEnviar = {
        destinatario: correoAdmi,
        destinatario2: emailuser,
        asunto: 'Detalles de la Reserva Realizada', 
        fechaInicial: fecha1,
        fechaFinal: fecha2,
        nombreCompleto: nombreYApellido,
        diferenciaDias: diferenciaDiass, 
        ptotal: ptotal, 
    };
   console.log('Datos a enviar a la API:', datosParaEnviar  );
 
    
   
   fetch(`${BACKEND_URL2}/api/enviar-correo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
               
            },
            body: JSON.stringify(datosParaEnviar)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Hubo un error  en el servidor.');
            }
            return response.text(); 
        })
        .then(async data => {

            console.log('Respuesta de la API de correo:', data);
                      
        })
        .catch(error => {
            console.error('Error al enviar la reserva:', error);
            showMessage('Hubo un error al realizar la reserva. Inténtalo de nuevo.', 'danger');
        });

}




});