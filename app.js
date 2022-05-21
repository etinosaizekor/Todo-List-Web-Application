//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todoDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = {
  name: String
};

const Item = mongoose.model("item", itemSchema);

const item1 = new Item({
  name: "Go visit a friend"
});
const item2 = new Item({
  name: "Go to the beach"
});
const item3 = new Item({
  name: "Make dinner"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

let flag = 0;
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find({}, function (err, results) {

    if (results.length === 0 && flag == 0) {
      Item.insertMany(defaultItems, function (err) {
        flag = 1;
        if (err) {
          console.log(err);
        } else {
          console.log("Items were saved successfully to database");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: results
      });
    }
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
    List.findOne({
      name: listName
    }, function (err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        console.log("Successfully saved");
        res.redirect("/" + listName);
      } else {
        console.log(err);
      }

    });
  }

});

app.post("/delete", function (req, res) {
  checkedItemId = req.body.checkbox;
  listRoute = req.body.hiddenCheckBox;

  if (listRoute === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listRoute
    }, {
      $pull: {
        "items": {
          _id: checkedItemId
        }
      }
    }, function (err, result) {
      if (!err) {
        res.redirect("/" + listRoute);
      }
    });
  }

});

app.get("/:path", function (req, res) {
  const pathName = _.capitalize(req.params.path);

  List.findOne({
    name: pathName
  }, function (err, result) {
    if (!err) {
      if (result) {
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items
        });
      } else {
        const list = new List({
          name: pathName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + pathName);
      }
    } else {
      console.log(err);
    }
  });
});


app.get("/about", function (req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function () {
  console.log("Server has started successfully");
});