# ============================================
# DOCKERFILE FOR BACKEND (Node.js + Express)
# ============================================
# A Dockerfile is like a recipe - it tells Docker
# step by step how to build your application image.

# -------- STEP 1: Choose a Base Image --------
# FROM tells Docker what image to start with.
# Think of it as choosing your operating system.
# "node:20-alpine" means:
#   - node:20 = Node.js version 20
#   - alpine = A tiny Linux distro (makes image smaller!)
# Alpine is only ~5MB vs ~1GB for full Linux!
FROM node:20-alpine

# -------- STEP 2: Set Working Directory --------
# WORKDIR creates a folder inside the container
# and makes it the "current directory" for all commands.
# It's like doing "mkdir /app && cd /app"
WORKDIR /app

# -------- STEP 3: Copy Package Files First --------
# We copy package.json and package-lock.json FIRST
# before copying the rest of the code.
# 
# WHY? Docker caches each step. If package.json hasn't
# changed, Docker skips "npm install" on rebuild.
# This makes rebuilding MUCH faster!
COPY package*.json ./

# -------- STEP 4: Install Dependencies --------
# RUN executes a command during the BUILD process.
# This installs all your npm packages.
# 
# --omit=dev skips devDependencies (nodemon, eslint, etc.)
# because we don't need them in production!
RUN npm install --omit=dev

# -------- STEP 5: Copy Application Code --------
# Now we copy ALL the remaining files.
# The "." means "current directory" on both ends:
#   COPY <from your computer> <to container>
COPY . .

# -------- STEP 6: Expose Port --------
# EXPOSE tells Docker which port the app uses.
# This is for documentation - it doesn't actually
# publish the port (that's done with -p flag when running)
EXPOSE 3000

# -------- STEP 7: Define Startup Command --------
# CMD is the command that runs when container STARTS.
# We use "node app.js" instead of "nodemon" because
# nodemon is for development (auto-restart on changes).
# In production, we just run node directly.
#
# The array format ["node", "app.js"] is preferred
# over string format "node app.js" for proper signal handling.
CMD ["node", "app.js"]
