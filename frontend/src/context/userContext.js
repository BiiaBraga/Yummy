import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Recupere o valor inicial do sessionStorage. Se não houver valor no sessionStorage, use `null`
  const storedUserType = sessionStorage.getItem('userType') || null;
  const storedUserID = sessionStorage.getItem('userID') || null;
  const storedUserName = sessionStorage.getItem('userName') || null;

  const [userType, setUserType] = useState(storedUserType);
  const [userID, setUserID] = useState(storedUserID);
  const [userName, setUserName] = useState(storedUserName);

  // Salve o valor no sessionStorage sempre que `userType` mudar
  useEffect(() => {
    if (userType) {
      sessionStorage.setItem('userType', userType);
    }
    if (userID) {
      sessionStorage.setItem('userID', userID);
    } 
    if (userName) {
      sessionStorage.setItem('userName', userName);
    }
  }, [userType, userID, userName]);

  return (
    <UserContext.Provider value={{ userType, setUserType, userID, setUserID, userName, setUserName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
