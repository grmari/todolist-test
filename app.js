//jshint esversion:6

import express from "express";
import mongoose from "mongoose";
import _ from "lodash";
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));


// global variables
// const itemList= ["Web-dev lectures", "Exam reading", "Complete protein intake", "Book reading"];
// const workItem = [];

//database 
mongoose.connect("mongodb+srv://mariagribanova:DCadFbcPUutm5156@cluster0.lmhz4s6.mongodb.net/todolistDB");
// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true });
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({}).then(function (foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(function () {
        console.log("Successfully saved default items to DB.");
        res.redirect("/");
      }).catch(function (err) {
        console.log(err);
      });
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  }).catch(function (err) {
    console.log(err);
    res.status(500).send("Error fetching items");
  });

});




app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }).catch(function (err) {
      console.log(err);
    });
  };
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({ _id: checkedItemId }).then(() => {
      console.log("Saccessfully deleted checked item.");
      res.redirect("/");
    }).catch(function (err) {
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).then(function (foundList) {
      res.redirect("/" + listName);
    }).catch(function (err) {
      console.log(err);
    });
  }
});

// app.get("/work", function(req, res){
//   res.render("list", {listTitle: "Work List", newItem: workItem})
// })
// app.post("/work", function(req, res){
//   // console.log(req.body);
//   const item = req.body.newInput;
//   workItem.push(item);
//   res.redirect("/work")
// })

// app.get("/about", function (req, res) {
//   res.render("about");
// });

// routings
// app.get("/custom/:customListName", function(req,res){
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  if (customListName === "Favicon.ico") return;
  console.log(customListName);
  List.findOne({ name: customListName })
    .then(foundList => {
      if (customListName === "About") {
        res.render("about");
      } else if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        return list.save()
          .then(() => {
            res.redirect("/" + customListName);
          })
          .catch(err => {
            console.log(err);
            throw err;
          });
      } else {
        //Show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send("Error fetching list");
    });
});

mongoose.connect("mongodb+srv://mariagribanova:DCadFbcPUutm5156@cluster0.lmhz4s6.mongodb.net/todolistDB").then(
  app.listen(3000, function () {
    console.log("Server started on port 3000");
  })
);
