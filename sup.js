const supabaseUrl = 'https://yqmazmbpbbqsryynpwfo.supabase.co'
const supabaseAnonKey = 'sb_publishable_4mdNSzXhf6_u76D6ADhSuQ_0spj34kD'

const supabaseClient = supabase.createClient(
  supabaseUrl,
  supabaseAnonKey
)

/* =========================
   SIGNUP FORM
========================= */
const signupForm = document.querySelector('.signup-form')
const signupEmail = signupForm.querySelector('input[type="email"]')
const signupPassword = signupForm.querySelector('input[type="password"]')

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const { data, error } = await supabaseClient.auth.signUp({
    email: signupEmail.value,
    password: signupPassword.value
  })

  console.log('SIGNUP RESULT:', data, error)

  if (error) {
    alert(error.message)
  } else {
    alert('Account created')
  }
})

/* =========================
   LOGIN FORM
========================= */
const loginForm = document.querySelector('.login-form')
const loginEmail = loginForm.querySelector('input[type="email"]')
const loginPassword = loginForm.querySelector('input[type="password"]')

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: loginEmail.value,
    password: loginPassword.value
  })

  console.log('LOGIN RESULT:', data, error)

  if (error) {
    alert(error.message)
  } else {
    alert('Logged in')
  }
})

/* =========================
   AUTH STATE
========================= */
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log(event)
  console.log(session)

  if (event === 'SIGNED_IN' && session) {
    console.log('User signed in:', session.user)
  }

  if (!session) {
    console.log('No user signed in')
  }
})
