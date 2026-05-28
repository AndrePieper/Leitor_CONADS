const panels = document.querySelectorAll('.form-panel');
const dots = document.querySelectorAll('.page-dot');

function showPanel(id) {
  panels.forEach(panel => panel.id === id ? panel.classList.remove('hidden') : panel.classList.add('hidden'));
  dots.forEach(dot => dot.classList.toggle('active', dot.dataset.target === id));
}

dots.forEach(dot => {
  dot.addEventListener('click', () => showPanel(dot.dataset.target));
});

document.getElementById('btn-enter').addEventListener('click', () => {
  const user = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!user || !password) {
    alert('Preencha usuário e senha.');
    return;
  }
  showPanel('register-panel');
});

document.getElementById('btn-register').addEventListener('click', () => {
  showPanel('scanner-panel');
});

document.getElementById('btn-back').addEventListener('click', () => {
  showPanel('login-panel');
});
