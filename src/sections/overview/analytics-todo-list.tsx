import type { CardProps } from '@mui/material/Card';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { useTranslation } from 'src/contexts';
import { isElectron, actionItemsDB } from 'src/services/db'; // Import our new database endpoint

import { Iconify } from 'src/components/iconify';

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
  const { t } = useTranslation();
  const [todos, setTodos] = useState<TodoItem[]>(list);
  const [input, setInput] = useState('');

  // Load persistent note records statically on mount
  useEffect(() => {
    if (isElectron()) {
      actionItemsDB.getAll().then((items) => {
        if (items) setTodos(items);
      }).catch((err) => window.appLog?.error(err));
    }
  }, []);

  const handleAddTodo = () => {
    if (input.trim()) {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: input,
        completed: false,
      };

      // Native SQLite append
      if (isElectron()) {
        actionItemsDB.add(newTodo).catch((err) => window.appLog?.error(err));
      }

      setTodos([...todos, newTodo]);
      setInput('');
    }
  };

  const handleToggleTodo = (id: string) => {
    // Native SQLite toggle
    if (isElectron()) {
      actionItemsDB.toggle(id).catch((err) => window.appLog?.error(err));
    }
    
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const handleDeleteTodo = (id: string) => {
    // Native SQLite deletion
    if (isElectron()) {
      actionItemsDB.delete(id).catch((err) => window.appLog?.error(err));
    }
    
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <Card sx={[{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 350 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <CardHeader
        title={title}
        subheader={`${completedCount} / ${todos.length}`}
      />

      <Box sx={{ overflowY: 'auto', maxHeight: 210 }}>
        <List sx={{ minWidth: 360 }}>
          {[...todos].reverse().map((todo) => (
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
      </Box>

      <Box sx={{ p: 2.5, gap: 1, display: 'flex' }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('common.add')}
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
          {t('common.add')}
        </Button>
      </Box>
    </Card>
  );
}
