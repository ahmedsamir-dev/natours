const form = document.querySelector('.form--login');

if (form)
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const [email, password] = [
      document.getElementById('email').value,
      document.getElementById('password').value,
    ];

    login(email, password);
  });

const login = async (email, password) => {
  try {
    // const reponse = await fetch("/auth/login", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     email,
    //     password,
    //   }),
    //   headers: { "Content-Type": "application/json" },
    // });

    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      alert('You are now logged in');

      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (e) {
    console.log(e.response.data.message);
  }
};

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
    });

    if (res.data.status === 'success') {
      console.log(res.data);
      location.reload();
    }
  } catch (e) {
    console.log(e.response.data);
    alert('Error while logging out');
  }
};

document.querySelector('.nav__el--logout').addEventListener('click', logout);
