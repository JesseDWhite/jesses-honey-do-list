import { useState, useEffect } from "react";
import "./App.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import * as MUI from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

function App() {
  async function fetchData() {
    const querySnapshot = await getDocs(collection(db, "to-do-list"));
    const items = sortList(querySnapshot.docs.map((doc) => doc.data()));
    setList(items);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function addItem(item) {
    const id = crypto.randomUUID();
    const newItem = {
      task: item,
      complete: false,
      id: id,
      date_added: new Date(),
    };
    const newList = [...list, newItem];
    const sortedList = sortList(newList);
    setList(sortedList);
    setFormValue("");
    await setDoc(doc(db, "to-do-list", id), newItem);
  }

  async function inputChange(e) {
    const { value } = e.target;
    setFormValue((prev) => value);
  }

  async function closeItem(item, index) {
    const newItem = {
      ...item,
      complete: !item.complete,
    };

    const newList = list.map((listItem) => {
      if (listItem.id === item.id) {
        return newItem;
      } else return listItem;
    });
    const sortedList = sortList(newList);

    setActiveIndex(index);
    setList(newList);
    await setDoc(doc(db, "to-do-list", item.id), newItem);
    setTimeout(() => setActiveIndex(null), 150);
  }

  async function deleteItem(item) {
    const newList = list.filter((listItem) => listItem.id !== item.id);
    setList(newList);
    await deleteDoc(doc(db, "to-do-list", item.id));
  }

  function sortList(items) {
    const sorted = [...items].sort((a, b) => {
      const completeDiff = Number(a.complete) - Number(b.complete);
      if (completeDiff !== 0) return completeDiff;

      const da = new Date(a.date_added).getTime();
      const db = new Date(b.date_added).getTime();

      const aValid = Number.isFinite(da);
      const bValid = Number.isFinite(db);
      if (aValid && bValid) return db - da; // newest -> oldest
      if (aValid) return -1;
      if (bValid) return 1;
      return 0;
    });
    return sorted;
  }

  function formatDate(timestamp) {
    if (typeof timestamp === "string") return timestamp;
    if (!(timestamp instanceof Date)) timestamp = timestamp.toDate();

    const month = timestamp.toLocaleString("en-US", { month: "long" });
    const day = timestamp.getDate();
    const year = timestamp.getFullYear();

    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";

    return `${month} ${day}${suffix}, ${year}`;
  }

  const [list, setList] = useState([]);
  const [formValue, setFormValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <main>
      <div className="input-container">
        <MUI.TextField
          label="Add New Task"
          variant="outlined"
          fullWidth
          value={formValue}
          onChange={inputChange}
          autoComplete="off"
        />
        <MUI.Button
          sx={{
            paddingX: "40px",
          }}
          variant="outlined"
          color="success"
          fullWidth
          onClick={() => addItem(formValue)}
        >
          Add
        </MUI.Button>
      </div>
      <section>
        {list.map((item, index) => (
          <div
            key={item.id}
            className={
              activeIndex === index ? "list-item clicked" : "list-item"
            }
          >
            <MUI.IconButton
              color="error"
              onClick={() => {
                deleteItem(item);
              }}
            >
              <DeleteOutlinedIcon />{" "}
            </MUI.IconButton>
            <MUI.FormControlLabel
              control={
                <MUI.Checkbox checked={item?.complete} color="success" />
              }
              label={
                <>
                  <MUI.Box
                    component="span"
                    sx={{
                      color: "#6b6375",
                    }}
                  >
                    {formatDate(item.date_added)}
                    {": "}
                  </MUI.Box>
                  <MUI.Box component="span">{item.task}</MUI.Box>
                </>
              }
              onChange={() => closeItem(item, index)}
              sx={{
                color: "black",
              }}
            />
          </div>
        ))}
      </section>
    </main>
  );
}

export default App;
