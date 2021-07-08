const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { currentPassword, newPassword, passwordConfirm },
      'password'
    );
  });
}

if (updateDataForm) {
  updateDataForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log(form);

    await updateSettings(form, 'data');
  });
}

const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'data'
        ? 'http://localhost:3000/api/v1/users/updateMe'
        : 'http://localhost:3000/api/v1/users/updateMyPassword';

    const result = await axios({
      method: 'Patch',
      url,
      data,
    });

    alert(result.data.status);
  } catch (error) {
    console.log(error.response.data.message);
  }
};
