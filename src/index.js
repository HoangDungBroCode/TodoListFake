import React, { useState } from "react";
import { useImmer } from "use-immer";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import tickIconURL from "./graphics/tick.svg"
import circleIconURL from "./graphics/circle.svg"
import deleteIconURL from "./graphics/delete.svg";
import todolistIconURL from "./graphics/todolist.svg";

function AddInput(props) {
  function handleAddTask(e) {
    if (e.keyCode !== 13) return;
    if (e.target.value === "") return;

    props.handleAddTask(e.target.value);
    e.target.value = "";
  }

  return (
    <React.Fragment>
      <input
        onKeyDown={handleAddTask}
        className="add-input"
        type="text"
        placeholder="E.g. Build a web app"
      />
    </React.Fragment>
  );
}

function ListItem(props) {
  let itemID = props.item.id;

  function handleMarkDone(e) {
    props.handleMarkDone(itemID);
  }

  function handleDelete(e) {
    props.handleDelete(itemID);
  }

  return (
    <li>
      {props.item.isDone ? (
        <span className="item-icon tick-icon">
          <img onClick={handleMarkDone} src={tickIconURL} alt="" />
        </span>
      ) : (
        <span className="item-icon tick-icon">
          <img onClick={handleMarkDone} src={circleIconURL} alt="" />
        </span>
      )}
      {props.item.isDone ? (
        <p className="linethrough">{props.item.taskStr}</p>
      ) : (
        <p>{props.item.taskStr}</p>
      )}
      <span className="item-icon delete-icon">
        <img onClick={handleDelete} src={deleteIconURL} alt="" />
      </span>
    </li>
  );
}

function ListTable(props) {
  return (
    <ul className="list-table">
      {props.lists.map((e) => (
        <ListItem
          handleMarkDone={props.handleMarkDone}
          handleDelete={props.handleDelete}
          key={e.id}
          item={e}
        />
      ))}
    </ul>
  );
}

let lists = null;
let setLists = null;
function Todolist(props) {
  [lists, setLists] = useImmer(props.lists);

  function handleAddTask(newTaskStr) {
    let newItem = {
      id: currentTaskID + 1,
      taskStr: newTaskStr,
      isDone: false,
    };
    currentTaskID++;

    // add new item to local list in this component
    setLists((draft) => {
      draft.push(newItem);
    });

    // perform update to outer list so you can save them when user exit your website
  }

  function handleMarkDone(itemID) {
    setLists((draft) => {
      let item = draft.find((e) => e.id === itemID);
      item.isDone = !item.isDone;
    });
  }

  function handleDelete(itemID) {
    setLists((draft) => {
      let item = draft.find((el) => el.id === itemID);
      let index = draft.indexOf(item);
      draft.splice(index, 1);
    });
  }

  return (
    <React.Fragment>
      <h1>todos</h1>
      {!lists.length && (
        <>
          <img className="todo-cover" src={todolistIconURL} alt="" />
          <h5>Add your first to do</h5>
          <p>What do you want to get done today ?</p>
        </>
      )}

      <ListTable
        handleMarkDone={handleMarkDone}
        handleDelete={handleDelete}
        lists={lists}
      />
      <AddInput handleAddTask={handleAddTask} />
    </React.Fragment>
  );
}

// Load the list from indexedDB
let mylist = [];

let openRequest = indexedDB.open("db", 1);

openRequest.onupgradeneeded = function () {
  let db = openRequest.result;
  db.createObjectStore("todolist", { keyPath: "id" });
};

openRequest.onerror = function () {
  console.error("Error: ", openRequest.error);
};

// the global database
openRequest.onsuccess = function () {
  let db = openRequest.result;

  db.onversionchange = function () {
    db.close();
    alert("Database is outdated, please reload the page.");
  };

  let transaction = db.transaction("todolist", "readwrite");
  let todolist = transaction.objectStore("todolist");

  let request = todolist.getAll();
  request.onsuccess = function () {
    mylist = request.result;
  };

  transaction.oncomplete = function () {
    db.close();

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <Todolist lists={mylist} />
      </React.StrictMode>
    );
  };
};

openRequest.onblocked = function () {};

let currentTaskID = localStorage.getItem("currentTaskID");
if (!currentTaskID) currentTaskID = 0;

// before user exit the app, save the work
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();

  let openRequest = indexedDB.open("db", 1);

  openRequest.onupgradeneeded = function () {
    // upgrade or create new object store
  };

  openRequest.onerror = function () {
    console.log("Error: ", openRequest.error);
  };

  openRequest.onsuccess = function () {
    let db = openRequest.result;

    localStorage.setItem("currentTaskID", currentTaskID);

    let transaction = db.transaction("todolist", "readwrite");
    let todolist = transaction.objectStore("todolist");

    // remove all pre-existing items in db
    todolist.clear();

    // add current items in list to db
    for (let item of lists) {
      todolist.add(item);
    }

    transaction.oncomplete = function () {
      db.close();
    };
  };
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
