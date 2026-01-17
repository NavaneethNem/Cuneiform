const supabaseUrl = 'https://yqmazmbpbbqsryynpwfo.supabase.co'
const supabaseAnonKey = 'sb_publishable_4mdNSzXhf6_u76D6ADhSuQ_0spj34kD'

const supabaseClient = supabase.createClient(
supabaseUrl,
supabaseAnonKey
)

async function signUp() {
const { data, error } = await supabaseClient.auth.signUp({
    email: 'user@email.com',
    password: 'password123',
})

if (error) alert(error.message)
else console.log(data.user)
}

async function signIn() {
const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: 'user@email.com',
    password: 'password123',
})

if (error) alert(error.message)
else console.log('Logged in', data.user)
}

const { data } = await supabaseClient.auth.getUser()
console.log(data.user)

supabaseClient.auth.onAuthStateChange((event, session) => {
console.log(event)   // SIGNED_IN, SIGNED_OUT
console.log(session)
})

