This is a simple website project implemented RESTful API using **FastAPI** and **ReactJs** framework, **PostgresSQL** for database.
_____________________________________________________________________________________________________________________________________________________________________________
To run project: 
-First, you can download project zip -> extract it-> open project folder in your IDE or clone project to your IDE 
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

  + Once finish you can check the connection and API endpoints by :
    + cd to app folder in terminal 
    + type fastapi dev main.py
    + documentaion will contains API endpoint , models schema ( model DTO) 
    + Results should appears as this image below: 
    <img width="822" height="587" alt="image" src="https://github.com/user-attachments/assets/1ca90455-d59c-4565-8454-f02606a56374" />


_____________________________________________________________________________________________________________________________________________________________________________
-Run frontend server : 
+Open new IDE terminal instance
+ cd to **fe** folder 
+ type **npm run dev** and execute 
<img width="468" height="235" alt="image" src="https://github.com/user-attachments/assets/a5035e38-0a40-464b-a0c4-a172ae610203" />

