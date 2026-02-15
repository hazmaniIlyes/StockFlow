import type { CardProps } from '@mui/material/Card';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
};

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list?: TodoItem[];
};

export function AnalyticsTodoList({
  title,
  subheader,
  list = [],
  sx,
  ...other
}: Props) {
  const [todos, setTodos] = useState<TodoItem[]>(list);
  const [input, setInput] = useState('');

  const handleAddTodo = () => {
    if (input.trim()) {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: input,
        completed: false,
      };
      setTodos([...todos, newTodo]);
      setInput('');
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <Card sx={[{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 350 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <CardHeader
        title={title}
        subheader={`${completedCount} of ${todos.length} completed`}
      />

      <Scrollbar sx={{ flex: 1 }}>
        <List sx={{ minWidth: 360 }}>
          {todos.map((todo) => (
            <ListItemButton
              key={todo.id}
              sx={{
                py: 1.5,
                px: 2.5,
                gap: 1.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                <Checkbox
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                />
              </ListItemIcon>

              <ListItemText
                primary={todo.title}
                primaryTypographyProps={{
                  sx: {
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? 'text.disabled' : 'inherit',
                  },
                }}
              />

              <IconButton
                size="small"
                onClick={() => handleDeleteTodo(todo.id)}
                sx={{ flexShrink: 0 }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      </Scrollbar>

      <Box sx={{ p: 2.5, gap: 1, display: 'flex' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a new task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddTodo();
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddTodo}
          sx={{ flexShrink: 0 }}
          size="small"
        >
          Add
        </Button>
      </Box>
    </Card>
  );
}
