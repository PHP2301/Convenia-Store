import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import logging
from backend.config import DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connection_pool = None

def init_db_pool():
    global connection_pool
    try:
        if DATABASE_URL:
            connection_pool = pool.SimpleConnectionPool(
                1, 20,
                dsn=DATABASE_URL
            )
            logger.info("Database connection pool initialized using DATABASE_URL.")
        else:
            connection_pool = pool.SimpleConnectionPool(
                1, 20,
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
            logger.info("Database connection pool initialized using individual connection details.")
        logger.info("Database connection pool initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing connection pool: {e}")
        connection_pool = None

def get_connection():
    if connection_pool is None:
        init_db_pool()
    if connection_pool is None:
        raise Exception("Database connection pool is not available.")
    return connection_pool.getconn()

def release_connection(conn):
    if connection_pool and conn:
        connection_pool.putconn(conn)

def execute_query(query, params=None, fetch=False):
    global connection_pool
    conn = None
    try:
        conn = get_connection()
    except Exception as e:
        logger.error(f"Failed to get connection: {e}. Reinitializing pool...")
        init_db_pool()
        conn = get_connection()

    cursor = None
    try:
        # Use RealDictCursor to return results as dicts
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params or ())
        
        if fetch:
            result = cursor.fetchall()
        else:
            conn.commit()
            result = cursor.rowcount
            
        return result
    except (psycopg2.InterfaceError, psycopg2.OperationalError) as e:
        logger.warning(f"Database connection error: {e}. Retrying with fresh connection...")
        try:
            if cursor:
                cursor.close()
            if connection_pool and conn:
                connection_pool.putconn(conn, close=True)
        except Exception:
            pass
            
        # Re-initialize the pool and try once more
        init_db_pool()
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params or ())
        
        if fetch:
            result = cursor.fetchall()
        else:
            conn.commit()
            result = cursor.rowcount
            
        return result
    except Exception as e:
        if conn and not fetch:
            try:
                conn.rollback()
            except Exception:
                pass
        logger.error(f"Database query error: {e}\nQuery: {query}\nParams: {params}")
        raise e
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                release_connection(conn)
            except Exception:
                pass

