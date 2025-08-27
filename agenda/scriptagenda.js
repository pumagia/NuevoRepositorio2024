document.addEventListener('DOMContentLoaded', () => {
    // Definición de elementos y variables
    const calendarEl = document.getElementById('calendar');
    const messageDiv = document.getElementById('message');
    const form = document.getElementById('reservationForm');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const cancelDiv = document.createElement('div');
    cancelDiv.className = 'mt-3 text-center';
    calendarEl.parentNode.insertBefore(cancelDiv, calendarEl.nextSibling);

    const currentUser = localStorage.getItem('userId');
    let selectedEventId = null;
    let occupiedDates = [];

    // Inicialización del calendario FullCalendar
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
                        // Lógica para cancelar reserva
                        fetch(`/api/agendas/${selectedEventId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                            }
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('No se pudo cancelar la reserva en el servidor.');
                            }
                            occupiedDates = occupiedDates.filter(reserva => reserva.id !== selectedEventId);
                            selectedEventId = null;
                            displayOccupiedDatesOnCalendar(occupiedDates);
                            cancelDiv.innerHTML = '';
                            showMessage('Reserva cancelada correctamente.', 'success');
                            location.reload(); // Recarga la página después de cancelar
                        })
                        .catch(error => {
                            console.error('Error al cancelar la reserva:', error);
                            showMessage('Hubo un error al cancelar la reserva.', 'danger');
                        });
                    };
                } else {
                    showMessage('Esta reserva pertenece a otro usuario y no puede ser cancelada por ti.', 'warning');
                }
            }
        }
    });

    const displayOccupiedDatesOnCalendar = (occupiedDatesArray) => {
        const events = occupiedDatesArray.map((date) => ({
            id: date.id,
            title: date.userId == currentUser ? 'Mi Reserva' : 'Reservado',
            start: date.start,
            end: date.end,
            color: date.id == selectedEventId ? '#ffe066' : '#eb838d'
        }));
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

    // Evento de envío del formulario (el punto clave)
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Obtener y formatear las fechas (ya estaba en tu código)
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        // Validaciones (ya estaban en tu código)
        if (startDate === '' || endDate === '') {
            showMessage('Por favor, selecciona ambas fechas.', 'danger');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            showMessage('La fecha de inicio no puede ser posterior a la fecha de fin.', 'danger');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            showMessage('No puedes seleccionar una fecha en el pasado.', 'danger');
            return;
        }

        if (isOverlapping(start, end)) {
            showMessage('Las fechas seleccionadas ya están ocupadas. Por favor, elige otro período.', 'danger');
            return;
        }

        // 2. Crear el objeto de la nueva reserva
        const newReservation = {
            fecha_inicio: startDate,
            fecha_fin: endDate,
            id_usuario: currentUser // O el id del usuario que se haya obtenido
        };

        // 3. Enviar al servidor usando `fetch`
        fetch('/api/agendas', {
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
            return response.json(); // Si el servidor devuelve el objeto creado
        })
        .then(data => {
            showMessage('¡Reserva realizada con éxito!', 'success');
            form.reset();
            location.reload(); // 4. Recargar la página para ver la nueva reserva
        })
        .catch(error => {
            console.error('Error al enviar la reserva:', error);
            showMessage('Hubo un error al realizar la reserva. Inténtalo de nuevo.', 'danger');
        });
    });

    // Lógica para obtener reservas existentes del servidor (ya estaba en tu código)
    fetch('/api/agendas', {
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
});