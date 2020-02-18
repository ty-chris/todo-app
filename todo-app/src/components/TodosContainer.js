import React, { Component } from 'react'
import axios from 'axios'
import update from 'immutability-helper'
import checkboxes from './checkboxes';
import Checkbox from './Checkbox';


class TodosContainer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      todos: [], //all todos in db
      filtered: [], //all todos to show
      currentTabTodos: [], //all todos with current label

      inputValue: '', //input in search bar
      checkboxValue: "Nil", //current category displayed
      checkedItems: new Map(),
    }
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleBoxChange = this.handleBoxChange.bind(this);
  }

  getTodos() {
    axios.get('/api/v1/todos')
      .then(response => {
        this.setState({
          todos: response.data,
          filtered: response.data
        })
      })
      .catch(error => console.log(error))
  }

  componentDidMount() {
    this.getTodos()
    this.setState({
      filtered: this.state.todos
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      filtered: nextProps.items
    });
  }

  createTodo = (e) => {
    if (e.key === 'Enter') {
      axios.post('/api/v1/todos', { todo: { title: e.target.value, category: this.state.checkboxValue } })
        .then(response => {
          const todos = update(this.state.todos, {
            $splice: [[0, 0, response.data]]
          })
          const filtered = update(this.state.currentTabTodos, {
            $splice: [[0, 0, response.data]]
          })
          this.setState({
            todos: todos,
            inputValue: '',
            filtered: filtered,
          })
        })

        .catch(error => console.log(error))
    }
  }

  updateTodo = (e, id) => {
    axios.put(`/api/v1/todos/${id}`, { todo: { done: e.target.checked } })
      .then(response => {
        const todoIndex = this.state.todos.findIndex(x => x.id === response.data.id)
        const filteredIndex = this.state.filtered.findIndex(x => x.id === response.data.id)
        const todos = update(this.state.todos, {
          [todoIndex]: { $set: response.data }
        })
        const filtered = update(this.state.currentTabTodos, {
          [filteredIndex]: { $set: response.data }
        })
        this.setState({
          todos: todos,
          filtered: filtered,
        })
      })
      .catch(error => console.log(error))
  }

  deleteTodo = (id) => {
    axios.delete(`/api/v1/todos/${id}`)
      .then(response => {
        const todoIndex = this.state.todos.findIndex(x => x.id === id)
        const filteredIndex = this.state.currentTabTodos.findIndex(x => x.id === id)


        const todos = update(this.state.todos, {
          $splice: [[todoIndex, 1]]
        })
        const filtered = update(this.state.currentTabTodos, {
          $splice: [[filteredIndex, 1]]
        })
        this.setState({
          todos: todos,
          filtered: filtered,
        })
      })
      .catch(error => console.log(error))
  }

  //input bar 
  handleChange = (e) => {
    this.setState({
      inputValue: e.target.value,
    });
  }

  handleSearchChange(e) {
    // Variable to hold the original version of the list
    let currentList = [];
    // Variable to hold the filtered list before putting into state
    let newList = [];

    // If the search bar isn't empty
    if (e.target.value !== "") {
      // Assign the original list to currentList
      currentList = this.state.filtered;

      // Use .filter() to determine which items should be displayed
      // based on the search terms
      newList = currentList.filter(item => {
        // change current item to lowercase
        const lc = item.title.toLowerCase();
        // change search term to lowercase
        const filter = e.target.value.toLowerCase();
        // check to see if the current list item includes the search term
        // If it does, it will be added to newList. Using lowercase eliminates
        // issues with capitalization in search terms and search content
        return lc.includes(filter);
      });
    } else {
      // If the search bar is empty, set newList to original task list
      newList = this.state.todos;
    }
    // Set the filtered state based on what our rules added to newList
    this.setState({
      filtered: newList
    });
  }

  handleBoxChange(e) {
    const itemName = e.target.name;
    const isChecked = e.target.checked;

    this.setState({
      checkboxValue: e.target.name
    });

    this.setState(prevState => ({
      checkedItems: prevState.checkedItems.set(itemName, isChecked),
    }));

    let currentList = [];
    currentList = this.state.todos;

    let newList = [];

    if (isChecked) {
      switch (itemName) {
        case "Home":
          newList = currentList.filter(item => {
            const titles = item.category;
            return titles.includes("Home")
          });
          break;
        case "Work":
          newList = currentList.filter(item => {
            const titles = item.category;
            return titles.includes("Work")
          });
          break;
        case "Urgent":
          newList = currentList.filter(item => {
            const titles = item.category;
            return titles.includes("Urgent")
          });
          break;
        case "Misc":
          newList = currentList.filter(item => {
            const titles = item.category;
            return titles.includes("Misc")
          });
          break;
        default:
          newList = this.state.filtered;
      }
    } else {
      newList = this.state.todos;
    }

    this.setState({
      filtered: newList,
      currentTabTodos: newList
    })
  }

  render() {
    return (
      <div>
        <input type="text" className="search"
          onChange={this.handleSearchChange}
          placeholder="Search..." />
        <ul></ul>

        <div className="inputContainer">
          <input className="taskInput" type="text"
            placeholder="Add a task" maxLength="50"
            onKeyPress={this.createTodo}
            value={this.state.inputValue} onChange={this.handleChange} />
        </div>

        <div className="checkBox">
        <React.Fragment>
          {
            checkboxes.map(item => (
              <label key={item.key}>
                {item.name}
                <Checkbox name={item.name}
                  checked={this.state.checkedItems.get(item.name)}
                  onChange={this.handleBoxChange} />
              </label>
            ))
          }
        </React.Fragment></div>

        <div className="listWrapper">
          <ul className="taskList">
            {this.state.filtered.map((todo) => {
              return (
                <li className="task" todo={todo} key={todo.id}>
                  <input className="taskCheckbox" type="checkbox"
                    checked={todo.done}
                    onChange={(e) => this.updateTodo(e, todo.id)} />
                  <label className="taskLabel">{todo.title}</label>
                  <span className="deleteTaskBtn"
                    onClick={(e) => this.deleteTodo(todo.id)}>
                    x
            </span>
                </li>
              )
            })}

          </ul>
        </div>
      </div>
    )
  }
}

export default TodosContainer