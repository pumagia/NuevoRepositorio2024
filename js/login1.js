document.addEventListener('DOMContentLoaded', () => {

  
    const authContainer = document.getElementById('authContainer');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const openAuthButton = document.getElementById('openAuthModal');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const testimonioOpenButton = document.getElementById('testimonio_open');
    const mostrarComentariosDiv = document.getElementById('mostrarcomentarios');

   
    const loggedInSection = document.getElementById('loggedInSection');
    const addCommentBtn = document.getElementById('addCommentBtn');
    const agendaBtn = document.getElementById('agendaBtn');
    const endSectionBtn = document.getElementById('endSectionBtn');

    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    const messageModalLabel = document.getElementById('messageModalLabel');
    const messageModalBody = document.getElementById('messageModalBody');

    const seccionTestimonioDiv = document.getElementById('SeccioTestimonio');
    const testimonialForm = document.getElementById('testimonialForm');
    const testimonialComentaInput = document.getElementById('testimonial_comenta');


  

    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
        new bootstrap.Carousel(carousel, {
            interval: 3000
        });
    });

  
    const showLoginForm = () => {
        loginForm.hidden = false;
        registerForm.hidden = true;
        authContainer.hidden = false;
    };

    
    const showRegisterForm = () => {
        loginForm.hidden = true;
        registerForm.hidden = false;
        authContainer.hidden = false;
    };

   
    const hideAuthContainer = () => {
        authContainer.hidden = true;
    };

    /**
     * Muestra un modal con un mensaje y un título.
     * @param {string} title El título del modal.
     * @param {string} message El texto del mensaje a mostrar.
     */
    const showMessageModal = (title, message) => {
        messageModalLabel.textContent = title;
        messageModalBody.textContent = message;
        messageModal.show();
    };

    
    const showLoggedInSection = () => {
        hideAuthContainer();
        openAuthButton.style.display = 'none'; 
        loggedInSection.style.display = 'block'; 
    };

    
    const hideLoggedInSection = () => {
        loggedInSection.style.display = 'none';
        openAuthButton.style.display = 'block'; 
    };

  
    openAuthButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (authContainer.hidden) {
            showLoginForm();
        } else {
            hideAuthContainer();
        }
    });

    showRegisterLink.addEventListener('click', (event) => {
        event.preventDefault();
        showRegisterForm();
    });

   
    showLoginLink.addEventListener('click', (event) => {
        event.preventDefault();
        showLoginForm();
    });

   
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!loginForm.checkValidity()) {
            event.stopPropagation();
            loginForm.classList.add('was-validated');
            return;
        }

        const loginData = {
            email: loginEmailInput.value,
            clave: loginPasswordInput.value
        };

        fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error( 'Error en el inicio de sesión.');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Respuesta completa del servidor:', data);
            const { message, jwt, status, id_usuario } = data;

            if (status === true) {
                showMessageModal('Éxito',  '¡Inicio de sesión exitoso!');
                localStorage.setItem('jwtToken', jwt);
                localStorage.setItem('userId', id_usuario);
                showLoggedInSection(); 
            } else {
                showMessageModal('Error',  'Inicio de sesión fallido. Por favor, revisa tus credenciales.');
            }
        })
        .catch(error => {
            console.error('Ha ocurrido un error durante la petición:', error);
            showMessageModal('Error de Conexión',  'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.');
        });
    });

  
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!registerForm.checkValidity()) {
            event.stopPropagation();
            registerForm.classList.add('was-validated');
            return;
        }

        const registerData = {
            nombreyapellido: document.getElementById('register-nombreyapellido').value,
            clave: document.getElementById('register-clave').value,
            dni: document.getElementById('register-dni').value,
            email: document.getElementById('register-email').value,
            telefono: document.getElementById('register-telefono').value,
            enabled: true,
            accountNotExpired: true,
            accountNotLocked: true,
            credentialNotExpired: true,
            rolesList: [{ role_id: 1 }]
        };

        fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                   throw new Error( 'Error al registrar la cuenta.');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data && data.id_usuario) {
                showMessageModal('Registro Exitoso', '¡Registro exitoso! Ahora puedes iniciar sesión.');
                showLoginForm();
            } else {
                showMessageModal('Error', 'Error al registrar la cuenta. Inténtalo de nuevo.');
            }
        })
        .catch(error => {
            console.error('Error de registro:', error);
            showMessageModal('Error de Conexión', error.message || 'No se pudo registrar la cuenta. Inténtalo de nuevo.');
        });
    });

  

    addCommentBtn.addEventListener('click', () => {
       
        seccionTestimonioDiv.style.display = 'block';

        
        mostrarComentariosDiv.style.display = 'none';

       
        if (testimonioOpenButton) {
            testimonioOpenButton.innerHTML = "Regresar a comentarios";
        }
    });



    endSectionBtn.addEventListener('click', () => {
        hideLoggedInSection();
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userId');
        console.log('Has cerrado la sesión');
        showMessageModal('Cierre de Sesión', 'Has cerrado la sesión correctamente.');
    });

   
    testimonialForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const token = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            showMessageModal('Error de Autenticación', 'Por favor, inicia sesión para enviar un testimonio.');
            return;
        }

        if (!testimonialForm.checkValidity()) {
            event.stopPropagation();
            testimonialForm.classList.add('was-validated');
            return;
        }

        const testimonialData = {
            comenta: testimonialComentaInput.value,
            id_usuario: userId 
        };

        fetch('/api/comentarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(testimonialData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error al enviar el testimonio.');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data && data.id_comentario) {
                showMessageModal('Éxito', '¡Tu testimonio ha sido enviado con éxito!');
             
                console.log('enviado:', testimonialData);
                testimonialForm.reset();
                testimonialForm.classList.remove('was-validated');
            } else {
                showMessageModal('Error', 'No se pudo enviar el testimonio. Inténtalo de nuevo.');
            }
        })
        .catch(error => {
            console.error('Error al enviar el testimonio:', error);
            showMessageModal('Error', error.message || 'Error de conexión al enviar el testimonio.');
        });
    });


 

    testimonioOpenButton.addEventListener('click', () => {
        if (mostrarComentariosDiv.style.display === 'block') {
            mostrarComentariosDiv.style.display = 'none';
            testimonioOpenButton.innerHTML = "Leer Testimonios";
            mostrarComentariosDiv.innerHTML = '';
        } else {
            fetch('/api/comentarios')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener los comentarios.');
                }
                return response.json();
            })
            .then(comentarios => {
                if (comentarios.length === 0) {
                    mostrarComentariosDiv.innerHTML = '<p>No hay comentarios para mostrar.</p>';
                } else {
                    const comentariosHTML = comentarios.map(comentario => `
                        <div class="comentario">
                            <p>${comentario.comenta}</p>
                        </div>
                    `).join('');
                    mostrarComentariosDiv.innerHTML = comentariosHTML;
                    testimonioOpenButton.innerHTML = "Regresar";
                }
                mostrarComentariosDiv.style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarComentariosDiv.innerHTML = `<p style="color: red;"> Fuera de Linea el Servidor </p>`;
                mostrarComentariosDiv.style.display = 'block';
            });
        }
    });
});