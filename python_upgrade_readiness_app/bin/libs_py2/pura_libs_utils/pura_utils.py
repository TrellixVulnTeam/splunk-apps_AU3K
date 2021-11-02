import json


def render_json(data, response_code=200):
    """
    Render the data as JSON

    :param data: Response data
    :param response_code: Status code for response

    :return JSON response containing payload and status
    """

    return {
        'payload': json.dumps(data),
        'status': response_code,
        'headers': {
            'Content-Type': 'application/json'
        }
    }


def render_msg_json(message, response_code=200):
    """
    Render a message to be returned to the client.

    :param message: Success message to be displayed
    :param response_code: Status code for response

    :return JSON response containing payload and status
    """

    data = {
        'success': True,
        'message': message
    }

    return {
        'payload': json.dumps(data),
        'status': response_code,
        'headers': {
            'Content-Type': 'application/json'
        }
    }


def render_error_json(message, response_code=500):
    """
    Render an error to be returned to the client.

    :param message: Error message to be displayed
    :param response_code: Status code for response

    :return JSON response containing payload and status
    """

    data = {
        'success': False,
        'message': message
    }

    return {
        'payload': json.dumps(data),
        'status': response_code,
        'headers': {
            'Content-Type': 'application/json'
        }
    }


def render_csv(data, response_code=200):
    """
    Render the data as CSV

    :param data: Response data
    :param response_code: Status code for response

    :return CSV response containing payload and status
    """

    return {
        'payload': data,
        'status': response_code,
        'headers': {
            'Content-Type': 'text/csv'
        }
    }


def get_forms_args_as_dict(form_args):
    """
    Get the form arguments in the form of a dictionary.

    :param form_args: list of arguments

    :return dict containing name-value pair
    """

    post_arg_dict = {}

    for arg in form_args:
        name = arg[0]
        value = arg[1]

        post_arg_dict[name] = value

    return post_arg_dict


def convert_to_dict(query):
    """
    Create a dictionary containing the parameters.

    :param query: Query containing params

    :return Parameters
    """
    parameters = {}

    for key, val in query:

        # If the key is already in the list, but the existing
        # entry isn't a list then make the
        # existing entry a list and add thi one
        if key in parameters and not isinstance(parameters[key], list):
            parameters[key] = [parameters[key], val]

        # If the entry is already included as a list, then
        # just add the entry
        elif key in parameters:
            parameters[key].append(val)

        # Otherwise, just add the entry
        else:
            parameters[key] = val

    return parameters


def parse_in_string(in_string):
    """
    Parse the in_string

    :param in_string: String containing arguements

    :return params
    """

    params = json.loads(in_string)

    params['method'] = params['method'].lower()

    params['form_parameters'] = convert_to_dict(params.get('form', []))
    params['query_parameters'] = convert_to_dict(params.get('query', []))

    return params
