'use client';

import { useEffect } from 'react';

const welcome = String.raw`
    __  __                  __      __
   / / / /___ _      ______/ /_  __/ /
  / /_/ / __ \ | /| / / __  / / / / / 
 / __  / /_/ / |/ |/ / /_/ / /_/ /_/  
/_/ /_/\____/|__/|__/\__,_/\__, (_)   
                          /____/       
`;

export function ConsoleWelcome() {
  useEffect(() => {
    const key = 'console-welcome-shown';

    if (sessionStorage.getItem(key)) {
      return;
    }

    console.log(welcome);
    sessionStorage.setItem(key, 'true');
  }, []);

  return null;
}
