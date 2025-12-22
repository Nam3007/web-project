This is a simple website project implemented RESTful API using **FastAPI** and **ReactJs** framework, **PostgresSQL** for database.
_____________________________________________________________________________________________________________________________________________________________________________
To run project: 
-First, you can download project zip -> extract it-> open project folder in your IDE or clone project to your IDE 
-Terminal instances : Make sure that your terminal instance is in Command prompt type 
<img width="473" height="387" alt="image" src="https://github.com/user-attachments/assets/7457ec15-a63f-453c-9296-62e5b626701d" />

_____________________________________________________________________________________________________________________________________________________________________________
-Run backend server : 
+  open IDE terminal ( CMD type ) 
+  cd to **BE** folder 
+  active python virtual environment by using this command line: app>venv\scripts\activate.bat (window) 
<img width="680" height="46" alt="image" src="https://github.com/user-attachments/assets/20534e14-f665-4444-87b2-10174e79da7e" />

+  if a (venv) appear in your terminal as this format (venv) **C:\Users\bquoc\Downloads\restaurant_web\BE\app>** then you have successfully active virtual environment
_____________________________________________________________________________________________________________________________________________________________________________
-Connect database with backend server:
  + Create your database in postgresSQL and name it as you want
  + From your created database, create a schema and name it **restaurant**
  + once you created the database and schema , you can either run sql script to create table(OPTION 1) or let db.py creates tables automatically for you(OPTION 2): 
  
    --OPTION 1: navigate to restaurant schema in postgres -> Query tool -> Ctrl + o and select **sqlScript.sql** in BE folder -> execute query 

    
    --OPTION 2: open db.py, add **Base.metadata.create_all(bind=engine)** under **Base = declarative_base(metadata=metadata)**
  + In db.py change  db_url to your database url
  + Once finish you can check the connection and API endpoints by :
    + cd to app folder in terminal 
    + type fastapi dev main.py
    + documentaion will contains API endpoint , models schema ( model DTO) 
    + Results should appears as this image below: 
  <img width="1662" height="464" alt="image" src="https://github.com/user-attachments/assets/2ea845fa-b681-4bdf-9cb4-7888a9b73b45" />



_____________________________________________________________________________________________________________________________________________________________________________
-Run frontend server : 
+Open new IDE terminal instance ( CMD type ) 
+ cd to **fe** folder 
+ type **npm run dev** and execute 
<img width="1666" height="401" alt="image" src="https://github.com/user-attachments/assets/331b2a13-2e69-48e7-8fba-d0764e56a399" />


