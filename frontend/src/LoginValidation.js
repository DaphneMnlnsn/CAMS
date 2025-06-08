function LoginValidation(values){
    let error = {}
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/

    if(!email_pattern.test(values.email)){
        error.email = "Email incorrect"
    }
    else{
        error.email = ""
    }

    if(!password_pattern.test(values.password)){
        error.email = "Password incorrect"
    }
    else{
        error.email = ""
    }
    return error;
}

export default LoginValidation;