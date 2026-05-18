
/* 
   SISTEMA RECLASS - Lógica de Cadastro, Login e Agendamento
   Este script gerencia a autenticação simulada e a interface do usuário.
*/

// --- 1. CONFIGURAÇÕES E ESTADO DO SISTEMA ---
const ReclassSystem = {
    // Simulação de Banco de Dados no LocalStorage
    db: {
        getUsers: () => JSON.parse(localStorage.getItem('reclass_users')) || [],
        saveUser: (user) => {
            const users = ReclassSystem.db.getUsers();
            users.push(user);
            localStorage.setItem('reclass_users', JSON.stringify(users));
        },
        getCurrentUser: () => JSON.parse(localStorage.getItem('reclass_current_user')) || null,
        setCurrentUser: (user) => localStorage.setItem('reclass_current_user', JSON.stringify(user)),
        logout: () => localStorage.removeItem('reclass_current_user'),
        
        // Aulas agendadas
        getAppointments: () => JSON.parse(localStorage.getItem('reclass_appointments')) || [],
        saveAppointment: (appointment) => {
            const apps = ReclassSystem.db.getAppointments();
            apps.push(appointment);
            localStorage.setItem('reclass_appointments', JSON.stringify(apps));
        }
    }
};

// --- 2. LÓGICA DE CADASTRO ---
function gerenciarCadastro(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const codigoX = document.getElementById('codigoX').value.trim();
    
    // Validações básicas
    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    const usuariosExistentes = ReclassSystem.db.getUsers();
    if (usuariosExistentes.find(u => u.email === email)) {
        alert("Este e-mail já está cadastrado!");
        return;
    }

    // Identifica se é professor pelo Código X
    const tipo = codigoX !== "" ? "professor" : "aluno";

    const novoUsuario = {
        nome,
        email,
        senha, // Em um sistema real, a senha nunca seria salva em texto puro
        tipo,
        codigoX,
        dataCadastro: new Date().toISOString()
    };

    ReclassSystem.db.saveUser(novoUsuario);
    alert(`Cadastro de ${tipo} realizado com sucesso! Redirecionando para o login...`);
    window.location.href = 'login.html';
}

// --- 3. LÓGICA DE LOGIN ---
function gerenciarLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    const usuarios = ReclassSystem.db.getUsers();
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
        ReclassSystem.db.setCurrentUser(usuario);
        alert(`Bem-vindo, ${usuario.nome}!`);
        window.location.href = 'index.html';
    } else {
        alert("E-mail ou senha incorretos.");
    }
}

// --- 4. ATUALIZAÇÃO DA INTERFACE (PERFIL E MENU) ---
function atualizarInterface() {
    const user = ReclassSystem.db.getCurrentUser();
    const navUl = document.querySelector('.main-nav ul');

    if (user && navUl) {
        // Se estiver logado, remove Login/Cadastro e adiciona Perfil/Sair
        navUl.innerHTML = `
            <li><a href="index.html">Início</a></li>
            <li><a href="perfil.html" id="link-perfil"><strong><i class="fas fa-user"></i> Perfil</strong></a></li>
            <li><a href="aulas.html" class="btn-nav">Agendamento</a></li>
            <li><a href="#" id="btn-logout" style="color: var(--secondary-color);">Sair</a></li>
        `;

        // Evento de Logout
        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            ReclassSystem.db.logout();
            window.location.href = 'index.html';
        });
        
        // Se estiver na página de perfil, preenche os dados
        if (window.location.pathname.includes('perfil.html')) {
            document.getElementById('perfil-nome').textContent = user.nome;
            document.getElementById('perfil-email').textContent = user.email;
            document.getElementById('perfil-tipo').textContent = user.tipo.toUpperCase();
            
            if (user.tipo === 'professor') {
                document.getElementById('perfil-extra').innerHTML = `<strong>Código Identificador:</strong> ${user.codigoX}`;
            }
        }
    }
}

// --- 5. CONFIRMAÇÃO DE AULAS (AGENDAMENTO) ---
function confirmarAula(aulaId, aulaNome) {
    const user = ReclassSystem.db.getCurrentUser();
    
    if (!user) {
        alert("Você precisa estar logado para agendar uma aula!");
        window.location.href = 'login.html';
        return;
    }

    const confirmacao = confirm(`Deseja confirmar seu agendamento para a aula: ${aulaNome}?`);
    
    if (confirmacao) {
        const agendamento = {
            usuarioEmail: user.email,
            aulaId: aulaId,
            aulaNome: aulaNome,
            dataAgendamento: new Date().toLocaleString('pt-BR')
        };
        
        ReclassSystem.db.saveAppointment(agendamento);
        alert("Aula agendada com sucesso! Você pode conferir seus agendamentos no seu Perfil.");
    }
}

// --- 6. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    atualizarInterface();

    // Vincula o formulário de cadastro se existir na página
    const formCad = document.getElementById('formCadastro');
    if (formCad) formCad.addEventListener('submit', gerenciarCadastro);

    // Vincula o formulário de login se existir na página
    const formLog = document.getElementById('formLogin');
    if (formLog) formLog.addEventListener('submit', gerenciarLogin);
    
    // Exemplo de como vincular os botões de "Detalhes" ou "Agendar" nos cards de aula
    const botoesAula = document.querySelectorAll('.btn-card');
    botoesAula.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.class-card');
            const nomeAula = card.querySelector('h3').textContent;
            confirmarAula(index + 1, nomeAula);
        });
    });
});
