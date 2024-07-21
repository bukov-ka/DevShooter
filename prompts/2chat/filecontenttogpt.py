import os

def get_files_with_extension(directory, extensions, skip_dirs, skip_files):
    file_list = []
    for root, dirs, files in os.walk(directory):
        # Skip directories that are in the skip_dirs list
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            if file in skip_files:
                continue
            if any(file.lower().endswith(ext) for ext in extensions):
                file_list.append(os.path.join(root, file))
    return file_list

def extract_content_and_write_to_log(file_list):
    with open('output.log', 'w', encoding='utf-8') as output_file:
        for file_path in file_list:
            with open(file_path, 'r', encoding='utf-8') as input_file:
                content = input_file.read()
                output_file.write(f"<{file_path}>\n```\n{content}\n```\n")

if __name__ == "__main__":
    target_directory = "../../"  # Replace this with the path to your target directory
    extensions = ['.ts', '.tsx', '.js', '.json', '.html', '.css']
    skip_dirs = ['node_modules', '.git', 'dist']  # Add any directories you want to skip here
    skip_files = ['package-lock.json']  # Add any files you want to skip here

    files_to_process = get_files_with_extension(target_directory, extensions, skip_dirs, skip_files)
    extract_content_and_write_to_log(files_to_process)
