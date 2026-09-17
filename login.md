this is the process for registration i gave u the curl where 
password and confirm password field should not be shown on the registration (get-startted) page, a fixed password will be submitted from the api only 
curl --location 'https://mmcclub.co.uk/api/v1/customer/auth/registration' \
--header 'Content-Type: application/json' \
--data-raw '
{
    "first_name": "John",
    "last_name": "Doe",
    "email": "sourbh@monthmail.com",
    "phone": "+9204567890",
    "password": "password",
    "confirm_password": "password",
    "gender": "male",
    "date_of_birth": "1990-01-15"
}'
it will return below response
{
    "response_code": "registration_200",
    "message": "Successfully registered",
    "content": null,
    "errors": []
}

then for sending the otp we will run this api 
curl --location 'https://mmcclub.co.uk/api/v1/customer/auth/otp-login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test@monthmail.com"
}'
it will return otp 
{
    "response_code": "default_200",
    "message": "Successfully sent OTP",
    "content": {
        "otp": 3960
    },
    "errors": []
}

we will get the otp from same login api i.e to get the otp we need to run the login api with registerd email it will return the otp then we run the same api with same email and recieved otp for verification


response after submitting otp it will return token
{
    "response_code": "auth_login_200",
    "message": "Successfully logged in",
    "content": {
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NWZhYWFjNi1jMWQyLTRkNGMtYmViMS0wNDE5NmRkMmZhOGUiLCJqdGkiOiIzOGRkMjJmMTJkY2VjZDFhZDZhMjA2OWVlNTljZGZlOGRkZjk0MGM0MzRlMzRlMmJhMWViYTEyZTllYTE5NmNkODEwNzU1NWY5ZmNiM2VmOSIsImlhdCI6MTc4OTU0ODQ1My42NjM5NTQsIm5iZiI6MTc4OTU0ODQ1My42NjM5NTYsImV4cCI6MTgyMTA4NDQ1My42NTg1MTgsInN1YiI6IjJiMGZlOGY5LWNhN2YtNGJhZS05MmM3LWU2YzEzNzdhNDEyOSIsInNjb3BlcyI6W119.AHW-hiNZ6uwjD6audWlpf1pDALI1lmYqyxj1AZfnj7YiXn9Ldsafe-qDJQyxyhGoTMNU47Xr8JREY7hWVnNXp9suWeT6skDBPGj8Pf9aZuqMwoxtbzOYabinPCt2QKfkd5tQfDs-kKs25FoiNFMAqab0grXAJ69L0rsWheha2Fo_kWPvvka6osyrMrDFcvC2yVsFOqRiJzR3ACiH4Fv-retKuU6Zxg8ZJhIeQqNSe9C2ZKkUOlJapC3CMfsqmK-YB0Xc35um0IXNy7kcdbbzGQynD4ANzLGf7xJLNvlLV5i6CXRtAuUC-NT8QcsCfiQ0Q8--YGeTGFR-gHt8Md85PjoiXmNKqxinIauiy_CfBFv8TC5n7sSZEZDNtbxKL8w6U6_nAFUDLZEGqb6BWqqR0Tz4tFpfwkgIaH8gbe2nncdv-M6lzyOKwlSZth-lAnUbFn5-Lic-ZRhTP5dUkM6MVCmlxbqllpzU5WRbBZK9HXvfvYNko3xmxASCzEF_m9-mz8jn8yhA_RxbOL4S5jAyF6j53OASnLk0xH-DY8EwHtIsAPtPslayHW-8bjPQw3qFmMf_12KeIUWh0Wsr3Ew-hXLSZX5igiN24oXNQgO7poURyRzgj1bB0rR3u-q9WCn8EEsGBRwSSh4ivsm6Jfh4AMPRc0FXqSGHQHbs6DhCYkY",
        "is_active": 1
    },
    "errors": []
}

so the recieved token will be saved on local storage 
