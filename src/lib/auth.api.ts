import apiClient from "@/lib/http/apiClient";

export interface RegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
}

export interface loginData{
    email : string;
    otp:number
    
}

export const registerCustomer = async (data: RegistrationData) => {
  const response = await apiClient.post(
    "/customer/auth/registration",
    {
      ...data,

      
      password: "password",
      confirm_password: "password",
    }
  );

  return response.data;
};

export const loginCustomer = async (data: loginData)=>{
    const response = await apiClient.post(
        "customer/auth/otp-login",
        {
            ...data
        }
    );
    return response.data;
}

export const sendOtp = async (email: string) => {

    const response = await apiClient.post(
        "/customer/auth/otp-login",
        {
            email
        }
    );

    return response.data;
};