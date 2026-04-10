// Native fetch

async function run() {
    const email = 'test_relog@test.com';
    const password = 'pass';
    const name = 'Test User';

    try {
        console.log("1. SiGNUP...");
        let r1 = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password, name})
        });
        const d1 = await r1.text();
        console.log("Signup:", r1.status, d1);

        console.log("2. LOGIN...");
        let r2 = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        const d2 = await r2.text();
        console.log("Login:", r2.status, d2);
    } catch(e) {
        console.error(e);
    }
}
run();
