from flask import request, jsonify
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, vms
from flasgger import swag_from
import boto3, json, hmac, hashlib, base64, requests, time
from flask import current_app
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend


def start_vm_util(user_id, instance_os=None):
    """Starts a VM for the user."""

    vm = (
        vms.query.filter_by(employee_id=user_id)
        .filter_by(instance_os=instance_os)
        .first()
    )

    if not vm:
        return jsonify({"error": "User doesn't have vms"}), 404

    id = vm.instance_id
    default_region = current_app.config.get("DEFAULT_REGION")

    ec2 = boto3.client("ec2", region_name=default_region)

    try:
        response = ec2.start_instances(InstanceIds=[id])
        # Get Instance private IP address
        instance_info = ec2.describe_instances(InstanceIds=[id])
        instance_ip = instance_info["Reservations"][0]["Instances"][0][
            "PrivateIpAddress"
        ]
        url = create_guacamole_vnc_connection(user_id, instance_ip)

        vm.guacamole_url = url
        vm.status = "running"
        db.session.commit()

        return jsonify({"message": "VM started successfully", "URL": url}), 200
    except Exception as e:
        return jsonify({"error": "Error starting VM"}), 500


def stop_vm_util(user_id, instance_os=None):
    """Stops a VM for the user."""

    vm = (
        vms.query.filter_by(employee_id=user_id)
        .filter_by(instance_os=instance_os)
        .first()
    )

    if not vm:
        return jsonify({"error": "User doesn't have vms"}), 404

    id = vm.instance_id

    default_region = current_app.config.get("DEFAULT_REGION")
    ec2 = boto3.client("ec2", region_name=default_region)

    try:
        response = ec2.stop_instances(InstanceIds=[id])
        vm.status = "stopped"
        db.session.commit()
        return jsonify({"message": "VM stopped successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Error stopping VM"}), 500


def restart_vm_util(user_id, instance_os=None):
    """Restarts a VM for the user."""

    vm = (
        vms.query.filter_by(employee_id=user_id)
        .filter_by(instance_os=instance_os)
        .first()
    )

    if not vm:
        return jsonify({"error": "User doesn't have vms"}), 404

    id = vm.instance_id
    default_region = current_app.config.get("DEFAULT_REGION")

    ec2 = boto3.client("ec2", region_name=default_region)

    try:
        response = ec2.reboot_instances(InstanceIds=[id])
        # Get Instance private IP address
        instance_info = ec2.describe_instances(InstanceIds=[id])
        instance_ip = instance_info["Reservations"][0]["Instances"][0][
            "PrivateIpAddress"
        ]
        url = create_guacamole_vnc_connection(user_id, instance_ip)

        vm.guacamole_url = url
        db.session.commit()

        return jsonify({"message": "VM started successfully", "URL": url}), 200
    except Exception as e:
        return jsonify({"error": "Error restarting VM"}), 500


def vm_status_util(user_id):
    """Checks the status of a VM for the user."""

    user_vms = vms.query.filter_by(employee_id=user_id).all()
    default_region = current_app.config.get("DEFAULT_REGION")
    ec2 = boto3.client("ec2", region_name=default_region)

    result = {}
    for vm in user_vms:
        id = vm.instance_id
        os = vm.instance_os

        try:
            response = ec2.describe_instance_status(InstanceIds=[id])
            if response["InstanceStatuses"] == []:
                result[os] = "Stopped"
            else:
                result[os] = response["InstanceStatuses"][0]["InstanceState"]["Name"]
        except Exception as e:
            return jsonify({"error": "Error getting VM status"}), 500

    return jsonify(result), 200


def create_vms(employee_id) -> dict:
    """Creates VMs for new tester."""
    ec2 = boto3.client("ec2", region_name=current_app.config.get("DEFAULT_REGION"))

    vpc_id = current_app.config.get("VPC_ID")
    private_subnet_id = current_app.config.get("PRIVATE_SUBNET_ID")
    security_group_id = current_app.config.get("SECURITY_GROUP_ID")
    instance_type = current_app.config.get("INSTANCE_TYPE")
    image_ids = {
        "linux": current_app.config.get("LINUX_IMAGE_ID"),
        "windows": current_app.config.get("WINDOWS_IMAGE_ID"),
    }

    instances = {}

    for os, image_id in image_ids.items():
        response = ec2.run_instances(
            ImageId=image_id,
            InstanceType=instance_type,
            MaxCount=1,
            MinCount=1,
            NetworkInterfaces=[
                {
                    "SubnetId": private_subnet_id,
                    "DeviceIndex": 0,
                    "AssociatePublicIpAddress": False,
                    "Groups": [security_group_id],
                }
            ],
            TagSpecifications=[
                {
                    "ResourceType": "instance",
                    "Tags": [{"Key": "Name", "Value": f"{employee_id} - {os}"}],
                }
            ],
        )
        instance_id = response["Instances"][0]["InstanceId"]
        instances[os] = instance_id

    return instances


def create_guacamole_vnc_connection(user_id, vm_ip):
    # Need to handle the instnace os here
    """Creates a Guacamole VNC connection."""

    secret_key_hex = current_app.config.get(
        "GUACAMOLE_SECRET_HEX_KEY"
    )  # Replace with your 32-character hex key
    secret_key = bytes.fromhex(secret_key_hex)
    iv = bytes([0] * 16)  # 16-byte IV with all zero bytes

    # Generate expiration timestamp (e.g., 1 hour from now)
    expires = int((time.time() + 5400) * 3000)
    payload = {
        "username": f"{user_id}",  # Arbitrary username; does not need to exist in Guacamole
        "expires": expires,
        "connections": {
            "VNC-Session": {
                "protocol": "vnc",
                "parameters": {
                    "hostname": f"{vm_ip}",
                    "port": "5901",  # default VNC port
                    "password": "CollabSecVM",
                },
            }
        },
    }

    # Convert JSON payload to bytes
    json_data = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    # Create HMAC-SHA256 signature
    signature = hmac.new(secret_key, json_data, hashlib.sha256).digest()

    # Prepend signature to JSON data
    signed_data = signature + json_data

    # Encrypt the signed data using AES-128-CBC
    cipher = Cipher(
        algorithms.AES(secret_key), modes.CBC(iv), backend=default_backend()
    )
    encryptor = cipher.encryptor()

    # Pad the signed data to a multiple of 16 bytes
    pad_len = 16 - (len(signed_data) % 16)
    padded_data = signed_data + bytes([pad_len] * pad_len)

    # Perform encryption
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()

    # Base64-encode the encrypted data
    token = base64.b64encode(encrypted_data).decode("utf-8")

    url = f"{current_app.config.get('GUACAMOLE_URL')}/api/tokens"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {"data": token}
    response = requests.post(url, headers=headers, data=data)

    return f"{current_app.config.get('GUACAMOLE_URL')}/?token={response.json()['authToken']}"
