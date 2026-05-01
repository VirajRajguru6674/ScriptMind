-- Drop existing database and recreate
DROP DATABASE IF EXISTS youtube_notes;
CREATE DATABASE youtube_notes;
USE youtube_notes;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    google_id VARCHAR(255) DEFAULT NULL,
    github_id VARCHAR(255) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avatar_url TEXT DEFAULT NULL,
    ai_tone VARCHAR(50) DEFAULT 'educational',
    ai_detail_level VARCHAR(50) DEFAULT 'detailed',
    ai_language VARCHAR(50) DEFAULT 'en',
    role ENUM('user', 'admin') DEFAULT 'user',
    suspended_until DATETIME DEFAULT NULL,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_expires DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Notes history table
CREATE TABLE notes_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    video_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    thumbnail TEXT DEFAULT NULL,
    notes LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_favorite TINYINT(1) DEFAULT 0,
    category VARCHAR(50) DEFAULT 'uncategorized',
    KEY user_id (user_id),
    CONSTRAINT notes_history_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Collections table
CREATE TABLE collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY user_id (user_id),
    CONSTRAINT collections_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Collection items table
CREATE TABLE collection_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection_id INT NOT NULL,
    note_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY collection_id (collection_id),
    KEY note_id (note_id),
    CONSTRAINT collection_items_ibfk_1 FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE,
    CONSTRAINT collection_items_ibfk_2 FOREIGN KEY (note_id) REFERENCES notes_history (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Quiz mistakes table
CREATE TABLE quiz_mistakes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY user_id (user_id),
    CONSTRAINT quiz_mistakes_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    platform VARCHAR(50) DEFAULT 'system',
    status ENUM('unread', 'read') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY user_id (user_id),
    CONSTRAINT notifications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

