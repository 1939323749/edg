document.getElementById("fetchCaptcha").addEventListener("click", async () => {
  const response = await fetch("http://localhost:3000/get-cookie-and-captcha");
  const blob = await response.blob();
  const captchaImage = document.getElementById("captchaImage");
  captchaImage.src = URL.createObjectURL(blob);
  captchaImage.style.display = "block";
});

document
  .getElementById("loginForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const card = document.getElementById("card").value;
    const pwd = document.getElementById("pwd").value;
    const imgcode = document.getElementById("imgcode").value;

    const response = await fetch("http://localhost:3000/submit-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ card, pwd, imgcode }),
    });

    const result = await response.json();
    document.getElementById(
      "result"
    ).innerHTML = `IP: ${result.ip}<br>MAC: ${result.mac}}`;
  });
document.getElementById("login").addEventListener("click", async () => {
  const emailpwd = document.getElementById("emailpwd").value;
  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ emailpwd }),
  });
  const result = await response.json();
  document.getElementById("loginResult").innerHTML = `${result.message}`;
});
